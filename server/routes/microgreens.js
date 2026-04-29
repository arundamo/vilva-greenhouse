const express = require('express');
const router = express.Router();
const db = require('../database');

const parseName = (name) => {
  const match = String(name || '').match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (!match) {
    return {
      crop: String(name || '').trim(),
      cultivar: String(name || '').trim()
    };
  }
  return {
    crop: match[1].trim(),
    cultivar: match[2].trim()
  };
};

const CSV_DATA = `crop_name,sow_weight_g,medium,blackout,soak_time,grow_time_days,trueleaf_day,avg_harvest_g,notes,ease
amaranth_red_garnet,15,"coco_coir;soil;hydroponic_mat","3-ET,2-BO","no_soak","15-20",19,144,"susceptible_to_damping_off","intermediate"
arugula_slow_bolt,20,"coco_coir;soil","3-W,2-BO","no_soak","11-13",13,266,"mucilaginous_seeds","intermediate"
basil_lemon,7,"coco_coir;soil","3-ET,3-BO","no_soak","11-17+",10,80,"mucilaginous_seeds","intermediate"
basil_genovese,7,"coco_coir;soil","3-ET,3-BO","no_soak","11-17+",11,80,"mucilaginous_seeds","intermediate"
broccoli_purple_sprouting,20,"coco_coir;soil;hydroponic_mat","3-W,1-BO","no_soak","11-16",15,341,"","easy"
beets_bulls_blood,25,"coco_coir;soil","3-ET,2-BO","no_soak","11-22",21,128,"","intermediate"
beets_detroit_mix,25,"coco_coir;soil","3-ET,2-BO","no_soak","11-25",25,158,"cover_seed_with_thin_soil","intermediate"
borage,20,"coco_coir;soil","6-ET","no_soak","10-16",9,255,"cover_seed_with_thin_soil","intermediate"
basic_salad_mix,15,"coco_coir;soil","3-W,1-BO","no_soak","10-12",9,234,"","easy"
brussel_sprouts_long_island_improved,25,"coco_coir;soil","2-W,2-BO","no_soak","11-13",10,380,"gets_tall_on_its_own","easy"
cilantro_leisure_split,10,"coco_coir;soil","6-W","no_soak","13-17+",11,94,"cover_seed_with_thin_soil","intermediate"
corn_yellow_popcorn,200,"coco_coir;soil","4-W,3-BO","12_hours","7",2,200,"keep_out_of_light_entire_grow","easy"
cabbage_red_acre,17,"coco_coir;soil;hydroponic_mat","3-W,2-BO","no_soak","10-15",14,250,"","easy"
clover_red,25,"coco_coir;soil;hydroponic_mat","3-ET,2-BO","no_soak","6-10",5,189,"","easy"
clover_crimson,25,"coco_coir;soil;hydroponic_mat","3-ET,2-BO","no_soak","6-10",5,178,"","easy"
cress_cressida,16,"coco_coir;soil","2-ET,1-BO","no_soak","11-12",11,197,"mucilaginous_seeds","easy"
carrot,15,"coco_coir;soil","5-ET,1-BO","no_soak","17-20",13,177,"","intermediate"
dill,15,"coco_coir;soil","5-ET,1-BO","no_soak","17-20",13,177,"gets_tall_on_its_own","intermediate"
edible_marigold,3,"coco_coir;soil","3-W,1-BO","no_soak","13",7,52,"looks_best_with_true_leaf","easy"
kohlrabi_purple_vienna,20,"coco_coir;soil;hydroponic_mat","3-W,1-BO","no_soak","10-13",10,285,"","easy"
kale_blue_scotch,25,"coco_coir;soil;hydroponic_mat","3-W,2-BO","no_soak","10-12",9,236,"uneven_growth_without_weight","easy"
lettuce_gourmet_mix,10,"coco_coir;soil","3-ET,3-BO","no_soak","8-20",7,231,"can_be_bitter","easy"
lettuce_ruby_red,10,"coco_coir;soil","3-ET,3-BO","no_soak","8-20",8,190,"can_be_bitter","easy"
melon_cantaloupe_hales_best_jumbo,50,"coco_coir;soil","3-W,2-BO","no_soak","10-13",9,343,"cover_seed_with_thin_soil","easy"
mustard_spicy_oriental,12,"coco_coir;soil;hydroponic_mat","2-W,1-BO","no_soak","9-12",4,256,"","easy"
mustard_white_ice,12,"coco_coir;soil;hydroponic_mat","2-W,1-BO","no_soak","9-12",9,190,"uneven_growth_without_weight","easy"
mustard_red_giant,12,"coco_coir;soil;hydroponic_mat","2-W,1-BO","no_soak","9-12",5,100,"uneven_growth_without_weight","intermediate"
mustard_red_garnet,12,"coco_coir;soil;hydroponic_mat","2-W,1-BO","no_soak","9-12",8,174,"","easy"
nasturtium_jewel_mix,10,"coco_coir;soil","0-BO","no_soak","8+",6,"204+","cover_seed_with_thin_soil","easy"
nasturtium_empress_of_india,10,"coco_coir;soil","0-BO","no_soak","10+",7,"126+","cover_seed_with_thin_soil","easy"
orach_ruby_red,20,"coco_coir;soil","2-ET","no_soak","14+",6,89,"cover_seed_with_thin_soil","easy"
pea_speckled,250,"coco_coir;soil;no_medium","3-W,1-BO","8_hours","9-13",6,720,"can_grow_without_medium","easy"
pea_yellow,250,"coco_coir;soil;no_medium","3-W,1-BO","8_hours","9-13",8,387,"can_grow_without_medium","intermediate"
pea_green,250,"coco_coir;soil;no_medium","3-W,1-BO","8_hours","9-13",6,553,"can_grow_without_medium","intermediate"
radish_rambo,25,"coco_coir;soil;hydroponic_mat","3-W,1-BO","no_soak","8-10",9,406,"uneven_growth_without_weight","easy"
radish_china_rose,25,"coco_coir;soil;hydroponic_mat","3-W,1-BO","no_soak","8-11",7,471,"uneven_growth_without_weight","easy"
radish_hong_vit,25,"coco_coir;soil;hydroponic_mat","3-W,1-BO","no_soak","8-11",7,319,"uneven_growth_without_weight","easy"
radish_daikon,25,"coco_coir;soil;hydroponic_mat","3-W,1-BO","no_soak","8-11",7,361,"uneven_growth_without_weight","easy"
sunflower_black_oil,125,"coco_coir;soil;hydroponic_mat","3-W,2-BO","8hr/24hr/no_soak","7",5,500,"susceptible_to_mold","intermediate"
shiso_green,15,"coco_coir;soil;hydroponic_mat","5-W,2-BO","no_soak","11",6,100,"must_be_stretched","intermediate"
spicy_salad_mix,15,"coco_coir;soil","3-W,1-BO","no_soak","8-10",4,240,"","easy"
swiss_chard_ruby_red,25,"coco_coir;soil","3-W,3-BO","no_soak","12-25",25,203,"cover_seed_and_pat_firmly","intermediate"
tatsoi,20,"coco_coir;soil;hydroponic_mat","3-W,2-BO","no_soak","11-13",9,300,"","easy"`;

const splitCsvLine = (line) => {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
};

const normalizeCropName = (value) => String(value || '').trim();

const seedRows = CSV_DATA
  .split('\n')
  .slice(1)
  .filter(Boolean)
  .map((line) => {
    const [
      crop_name,
      sow_weight_g,
      medium,
      blackout,
      soak_time,
      grow_time_days,
      trueleaf_day,
      avg_harvest_g,
      notes,
      ease
    ] = splitCsvLine(line);

    return {
      crop: normalizeCropName(crop_name),
      cultivar: '',
      avg_1020_sow_weight_grams: String(sow_weight_g || '').trim(),
      medium: String(medium || '').trim(),
      blackout_weight_time: String(blackout || '').trim(),
      soak_time: String(soak_time || '').trim(),
      grow_time: String(grow_time_days || '').trim(),
      trueleaf_emerges: String(trueleaf_day || '').trim(),
      avg_harvest_grams: String(avg_harvest_g || '').trim(),
      growing_notes: String(notes || '').trim(),
      ease_of_grow: String(ease || '').trim(),
      seed_source: '',
      how_to_grow_video_link: '',
      source_page: null
    };
  });

const mapToDbRow = (input) => {
  const parsed = parseName(input.name || input.crop || '');
  return {
    crop: input.crop || parsed.crop,
    cultivar: input.cultivar || parsed.cultivar,
    avg_1020_sow_weight_grams: input.avg_1020_sow_weight_grams || '',
    medium: input.medium || '',
    blackout_weight_time: input.blackout_weight_time || '',
    soak_time: input.soak_time || '',
    grow_time: input.grow_time || '',
    trueleaf_emerges: input.trueleaf_emerges || '',
    avg_harvest_grams: input.avg_harvest_grams || '',
    growing_notes: input.growing_notes || '',
    ease_of_grow: input.ease_of_grow || '',
    seed_source: input.seed_source || '',
    how_to_grow_video_link: input.how_to_grow_video_link || '',
    soak_duration_hrs: input.soak_duration_hrs || input.soak_time || '',
    stack_duration: input.stack_duration || '',
    blackout_duration: input.blackout_duration || input.blackout_weight_time || '',
    humidity_dome: input.humidity_dome || '',
    under_lights: input.under_lights || '',
    hours_to_harvest: input.hours_to_harvest || input.grow_time || '',
    sterilize: input.sterilize ? 1 : 0,
    source_page: input.source_page || null
  };
};

router.get('/cultivators', (req, res) => {
  db.all(
    `SELECT * FROM microgreen_cultivator_info ORDER BY source_page ASC, crop ASC, cultivar ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

router.post('/cultivators', (req, res) => {
  const row = mapToDbRow(req.body || {});
  if (!row.crop) return res.status(400).json({ error: 'crop is required' });

  db.run(
    `INSERT INTO microgreen_cultivator_info (
      crop, cultivar, avg_1020_sow_weight_grams, medium, blackout_weight_time, soak_time, grow_time,
      trueleaf_emerges, avg_harvest_grams, growing_notes, ease_of_grow, seed_source, how_to_grow_video_link,
      soak_duration_hrs, stack_duration, blackout_duration, humidity_dome, under_lights, hours_to_harvest,
      sterilize, source_page
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.crop, row.cultivar, row.avg_1020_sow_weight_grams, row.medium, row.blackout_weight_time, row.soak_time,
      row.grow_time, row.trueleaf_emerges, row.avg_harvest_grams, row.growing_notes, row.ease_of_grow,
      row.seed_source, row.how_to_grow_video_link, row.soak_duration_hrs, row.stack_duration, row.blackout_duration,
      row.humidity_dome, row.under_lights, row.hours_to_harvest, row.sterilize, row.source_page
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Cultivator row created' });
    }
  );
});

router.put('/cultivators/:id', (req, res) => {
  const row = mapToDbRow(req.body || {});

  db.run(
    `UPDATE microgreen_cultivator_info SET
      crop = ?, cultivar = ?, avg_1020_sow_weight_grams = ?, medium = ?, blackout_weight_time = ?, soak_time = ?,
      grow_time = ?, trueleaf_emerges = ?, avg_harvest_grams = ?, growing_notes = ?, ease_of_grow = ?,
      seed_source = ?, how_to_grow_video_link = ?, soak_duration_hrs = ?, stack_duration = ?, blackout_duration = ?,
      humidity_dome = ?, under_lights = ?, hours_to_harvest = ?, sterilize = ?, source_page = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      row.crop, row.cultivar, row.avg_1020_sow_weight_grams, row.medium, row.blackout_weight_time, row.soak_time,
      row.grow_time, row.trueleaf_emerges, row.avg_harvest_grams, row.growing_notes, row.ease_of_grow,
      row.seed_source, row.how_to_grow_video_link, row.soak_duration_hrs, row.stack_duration, row.blackout_duration,
      row.humidity_dome, row.under_lights, row.hours_to_harvest, row.sterilize, row.source_page,
      req.params.id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Row not found' });
      res.json({ message: 'Cultivator row updated' });
    }
  );
});

router.delete('/cultivators/:id', (req, res) => {
  db.run('DELETE FROM microgreen_cultivator_info WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Row not found' });
    res.json({ message: 'Cultivator row deleted' });
  });
});

router.post('/cultivators/import-pdf', (req, res) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run('DELETE FROM microgreen_cultivator_info', [], (deleteErr) => {
      if (deleteErr) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: deleteErr.message });
      }

      const stmt = db.prepare(
        `INSERT INTO microgreen_cultivator_info (
          crop, cultivar, avg_1020_sow_weight_grams, medium, blackout_weight_time, soak_time, grow_time,
          trueleaf_emerges, avg_harvest_grams, growing_notes, ease_of_grow, seed_source, how_to_grow_video_link,
          soak_duration_hrs, stack_duration, blackout_duration, humidity_dome, under_lights, hours_to_harvest,
          sterilize, source_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const sourceRow of seedRows) {
        const row = mapToDbRow(sourceRow);
        stmt.run([
          row.crop,
          row.cultivar,
          row.avg_1020_sow_weight_grams,
          row.medium,
          row.blackout_weight_time,
          row.soak_time,
          row.grow_time,
          row.trueleaf_emerges,
          row.avg_harvest_grams,
          row.growing_notes,
          row.ease_of_grow,
          row.seed_source,
          row.how_to_grow_video_link,
          row.soak_duration_hrs,
          row.stack_duration,
          row.blackout_duration,
          row.humidity_dome,
          row.under_lights,
          row.hours_to_harvest,
          row.sterilize,
          row.source_page
        ]);
      }

      stmt.finalize((finalizeErr) => {
        if (finalizeErr) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: finalizeErr.message });
        }

        db.run('COMMIT', (commitErr) => {
          if (commitErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: commitErr.message });
          }
          res.json({ message: 'PDF data imported', count: seedRows.length });
        });
      });
    });
  });
});

module.exports = router;
