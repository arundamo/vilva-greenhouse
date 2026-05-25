import React, { useEffect, useMemo, useState } from 'react';

const TRACKER_STORAGE_KEY = 'vilva_crop_tracker_v4';

const CORE_CROPS = [
  {
    id: 'broccoli',
    name: 'Broccoli',
    emoji: '🥦',
    pills: ['Easy', 'No Soak', 'Brassica'],
    description:
      'Mild, earthy flavor and dense nutrition. Sow 20g per 1020 tray with 3-day weight + 1-day blackout. 11-16 days to harvest.',
    avgYield: '341g',
  },
  {
    id: 'arugula',
    name: 'Arugula',
    emoji: '🌿',
    pills: ['Intermediate', 'No Soak', 'Peppery'],
    description:
      'Bold peppery flavor. Mucilaginous seeds are normal when they stick to the top tray. Sow 20g, 3W + 2BO. 11-13 days.',
    avgYield: '266g',
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    emoji: '🌻',
    pills: ['Intermediate', 'Optional Soak', 'High Yield'],
    description:
      'Nutty crunch and fast growth. Sow 125g, 3W + 2BO. Optional 8-hour soak. Ready in 7-10 days with good airflow.',
    avgYield: '500g',
  },
  {
    id: 'pea',
    name: 'Pea',
    emoji: '🫛',
    pills: ['Intermediate', '8hr Soak', 'Sweet'],
    description:
      'Sweet tender shoots. Sow 250g with 8-hour soak, 3W + 1BO. Strong rooting and excellent visual quality. 9-13 days.',
    avgYield: '553g',
  },
  {
    id: 'radish',
    name: 'Radish',
    emoji: '🌱',
    pills: ['Easy', 'No Soak', 'Spicy'],
    description:
      'Crisp and spicy with quick turnaround. Sow 25g, 3W + 1BO. Fast harvest cycle in about 8-11 days.',
    avgYield: '406g',
  },
];

const SEEDING_TABS = {
  core: {
    label: 'Core 5',
    columns: ['Crop', 'Sow Weight', 'Weight Days', 'Blackout', 'Soak', 'Grow Time', 'Avg Yield', 'Difficulty'],
    rows: [
      ['Broccoli', '20g', '3 days', '1 day', 'No Soak', '11-16 days', '341g', 'Easy'],
      ['Arugula', '20g', '3 days', '2 days', 'No Soak', '11-13 days', '266g', 'Intermediate'],
      ['Sunflower (Black Oil)', '125g', '3 days', '1-2 days', '8hr or No Soak', '7-10 days', '500g', 'Intermediate'],
      ['Pea (Green)', '250g', '3 days', '1 day', '8hr Soak', '9-13 days', '553g', 'Intermediate'],
      ['Radish (Rambo)', '25g', '3 days', '1 day', 'No Soak', '8-10 days', '406g', 'Easy'],
    ],
  },
  extended: {
    label: 'Extended Crops',
    columns: ['Crop', 'Sow Weight', 'Blackout/Weight', 'Soak', 'Grow Time', 'Avg Yield', 'Notes', 'Difficulty'],
    rows: [
      ['Kale (Blue Scotch)', '25g', '3W, 2BO', 'No Soak', '10-12 days', '236g', '-', 'Easy'],
      ['Mustard (Spicy Oriental)', '12g', '2W, 1BO', 'No Soak', '9-12 days', '256g', '-', 'Easy'],
      ['Basic Salad Mix', '15g', '3W, 1BO', 'No Soak', '10-12 days', '234g', '-', 'Easy'],
      ['Spicy Salad Mix', '15g', '3W, 1BO', 'No Soak', '8-10 days', '240g', '-', 'Easy'],
      ['Beets (Bulls Blood)', '25g', '3ET, 2BO', 'No Soak', '11-22 days', '128g', '-', 'Intermediate'],
      ['Cilantro (Leisure Split)', '10g', '6W, 0BO', 'No Soak', '13-17+ days', '94g', 'Cover with thin soil layer', 'Intermediate'],
      ['Tatsoi', '20g', '3W, 2BO', 'No Soak', '11-13 days', '300g', '-', 'Easy'],
      ['Pea (Speckled)', '250g', '3W, 1BO', '8 Hours', '9-13 days', '720g', 'Very strong rooting', 'Easy'],
    ],
  },
  tray7x14: {
    label: '7x14 Tray',
    columns: ['Crop', 'Sow Weight (7x14)', 'Weight Days', 'Blackout', 'Soak', 'Grow Time'],
    rows: [
      ['Sunflower', '130-140g', '3-6 days', '1-2 days', 'No Soak', '7-10 days'],
      ['Peas', '130g', '4 days', '1 day', '8-12hr Soak', '9-13 days'],
      ['Brassicas', '15-25g', '3 days', '0-2 days', 'No Soak', '8-16 days'],
      ['Mustard', '10-15g', '2 days', '1-2 days', 'No Soak', '9-12 days'],
      ['Melon', '40g', '3 days', '2 days', 'No Soak', '10-13 days'],
      ['Cilantro', '10-20g', '6 days', '0 days', 'No Soak', '13-20 days'],
    ],
  },
};

const TRACKER_CROPS = [
  {
    id: 'broccoli',
    name: 'Broccoli',
    emoji: '🥦',
    notes: 'Mild earthy flavor. Dense nutrition and reliable weekly seller.',
    sow: '20g',
    growTime: '11-16 days',
    avgYield: '341g',
    weight: '3 days',
    blackout: '1 day',
    phases: [
      {
        label: 'Day 1-2',
        name: 'Sowing & Setup',
        tasks: [
          { day: 'Day 1', title: 'Sanitize trays, rinse and dry fully.' },
          { day: 'Day 2', title: 'Sow 20g evenly in moist medium and apply weight.' },
        ],
      },
      {
        label: 'Days 2-5',
        name: 'Weighted Germination',
        tasks: [
          { day: 'Day 3', title: 'Check root hairs and keep airflow running.' },
          { day: 'Day 4', title: 'Mist only if needed and maintain weight.' },
          { day: 'Day 5', title: 'Flip tray as dome for a 24-hour stretch.' },
        ],
      },
      {
        label: 'Days 6-10',
        name: 'Light & Growth',
        tasks: [
          { day: 'Day 6', title: 'Move under lights and start bottom watering.' },
          { day: 'Day 7-10', title: 'Maintain light, airflow and daily water checks.' },
        ],
      },
      {
        label: 'Days 11-16',
        name: 'Harvest & Reset',
        tasks: [
          { day: 'Day 11+', title: 'Harvest before true leaves fully mature.' },
          { day: 'Post', title: 'Clean, sanitize and record actual yield.' },
        ],
      },
    ],
  },
  {
    id: 'arugula',
    name: 'Arugula',
    emoji: '🌿',
    notes: 'Peppery profile. Mucilage on early days is expected behavior.',
    sow: '20g',
    growTime: '11-13 days',
    avgYield: '266g',
    weight: '3 days',
    blackout: '2 days',
    phases: [
      {
        label: 'Day 1-2',
        name: 'Sowing & Setup',
        tasks: [
          { day: 'Day 1', title: 'Sanitize tray set and prep medium moisture.' },
          { day: 'Day 2', title: 'Sow 20g evenly, cover and add weight.' },
        ],
      },
      {
        label: 'Days 2-6',
        name: 'Blackout',
        tasks: [
          { day: 'Day 3-4', title: 'Keep weighted phase stable and avoid overhandling.' },
          { day: 'Day 5', title: 'Flip for 24-hour stretch if lift is visible.' },
        ],
      },
      {
        label: 'Days 6-10',
        name: 'Light & Growth',
        tasks: [
          { day: 'Day 6', title: 'Move to lights and start bottom watering.' },
          { day: 'Day 7-10', title: 'Maintain airflow and monitor canopy consistency.' },
        ],
      },
      {
        label: 'Days 11-13',
        name: 'Harvest & Reset',
        tasks: [
          { day: 'Day 11+', title: 'Harvest for best flavor before full true-leaf stage.' },
          { day: 'Post', title: 'Reset trays and log output.' },
        ],
      },
    ],
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    emoji: '🌻',
    notes: 'Nutty and high-yield. Prioritize airflow and mold checks.',
    sow: '125g',
    growTime: '7-10 days',
    avgYield: '500g',
    weight: '3 days',
    blackout: '1-2 days',
    phases: [
      {
        label: 'Day 1',
        name: 'Soak & Setup',
        tasks: [
          { day: 'Night before', title: 'Optional 8-hour soak for faster germination.' },
          { day: 'Day 1', title: 'Sow dense single layer and apply weight.' },
        ],
      },
      {
        label: 'Days 2-4',
        name: 'Blackout',
        tasks: [
          { day: 'Day 2-3', title: 'Check moisture and intervene early on mold risk.' },
          { day: 'Day 4', title: 'Flip/transition to light once lift is strong.' },
        ],
      },
      {
        label: 'Days 4-7',
        name: 'Light & Growth',
        tasks: [
          { day: 'Day 4+', title: 'Bottom water daily and keep fan active.' },
        ],
      },
      {
        label: 'Days 7-10',
        name: 'Harvest & Reset',
        tasks: [
          { day: 'Day 7+', title: 'Harvest with open cotyledons before true leaves.' },
          { day: 'Post', title: 'Deep-clean trays to remove any mold spores.' },
        ],
      },
    ],
  },
  {
    id: 'pea',
    name: 'Pea (Green)',
    emoji: '🫛',
    notes: 'Sweet shoots with heavy water demand and dense roots.',
    sow: '250g',
    growTime: '9-13 days',
    avgYield: '553g',
    weight: '3 days',
    blackout: '1 day',
    phases: [
      {
        label: 'Day 1',
        name: 'Soak Required',
        tasks: [
          { day: 'Night before', title: 'Soak 8-12 hours, then drain and rinse.' },
          { day: 'Day 1', title: 'Sow dense layer and apply weight.' },
        ],
      },
      {
        label: 'Days 2-5',
        name: 'Blackout',
        tasks: [
          { day: 'Day 2-4', title: 'Watch fast lift and transition to dome/flip.' },
        ],
      },
      {
        label: 'Days 5-9',
        name: 'Light & Growth',
        tasks: [
          { day: 'Day 5+', title: 'Bottom water daily; peas drink heavily.' },
        ],
      },
      {
        label: 'Days 9-13',
        name: 'Harvest & Reset',
        tasks: [
          { day: 'Day 9+', title: 'Harvest with tender tips and strong tendrils.' },
          { day: 'Post', title: 'Clean dense root mat and sanitize thoroughly.' },
        ],
      },
    ],
  },
  {
    id: 'radish',
    name: 'Radish (Rambo)',
    emoji: '🌱',
    notes: 'Fast turnaround with strong color and spicy profile.',
    sow: '25g',
    growTime: '8-10 days',
    avgYield: '406g',
    weight: '3 days',
    blackout: '1 day',
    phases: [
      {
        label: 'Day 1-2',
        name: 'Sowing & Setup',
        tasks: [
          { day: 'Day 1', title: 'Sanitize trays and prep medium.' },
          { day: 'Day 2', title: 'Sow 25g evenly, cover and weight.' },
        ],
      },
      {
        label: 'Days 2-5',
        name: 'Blackout',
        tasks: [
          { day: 'Day 3-4', title: 'Track rapid germination and prepare flip.' },
          { day: 'Day 5', title: 'Move to light after dome phase.' },
        ],
      },
      {
        label: 'Days 5-7',
        name: 'Light & Growth',
        tasks: [
          { day: 'Day 5+', title: 'Daily bottom watering and canopy checks.' },
        ],
      },
      {
        label: 'Days 8-10',
        name: 'Harvest & Reset',
        tasks: [
          { day: 'Day 8+', title: 'Harvest before strong true-leaf development.' },
          { day: 'Post', title: 'Reset trays and log yield.' },
        ],
      },
    ],
  },
  {
    id: 'kale',
    name: 'Kale (Blue Scotch)',
    emoji: '🥬',
    notes: 'Reliable brassica crop with steady growth and mild profile.',
    sow: '25g',
    growTime: '10-12 days',
    avgYield: '236g',
    weight: '3 days',
    blackout: '2 days',
    phases: [
      {
        label: 'Setup',
        name: 'Sowing & Blackout',
        tasks: [
          { day: 'Day 1-2', title: 'Sow and apply weight in stable humidity.' },
          { day: 'Day 3-5', title: 'Run full blackout sequence before light.' },
        ],
      },
      {
        label: 'Finish',
        name: 'Light to Harvest',
        tasks: [
          { day: 'Day 6-10', title: 'Light phase with daily bottom watering.' },
          { day: 'Day 10+', title: 'Harvest and sanitize trays.' },
        ],
      },
    ],
  },
  {
    id: 'mustard',
    name: 'Mustard (Spicy Oriental)',
    emoji: '🌶️',
    notes: 'Compact cycle with strong heat and quick market readiness.',
    sow: '12g',
    growTime: '9-12 days',
    avgYield: '256g',
    weight: '2 days',
    blackout: '1 day',
    phases: [
      {
        label: 'Setup',
        name: 'Sowing & Blackout',
        tasks: [
          { day: 'Day 1-2', title: 'Sow light density and weighted setup.' },
          { day: 'Day 3-4', title: 'Short blackout and flip transition.' },
        ],
      },
      {
        label: 'Finish',
        name: 'Light to Harvest',
        tasks: [
          { day: 'Day 5-8', title: 'Grow under lights with daily bottom water.' },
          { day: 'Day 9+', title: 'Harvest for peak spice and reset.' },
        ],
      },
    ],
  },
];

const ROADMAP = [
  {
    days: 'Days 1-10',
    title: 'Foundation',
    tasks: [
      'Set up a compact system: shelving, trays, lights and airflow.',
      'Start with Core 5 crops for consistent weekly output.',
      'Lock in one repeatable weekly planting and harvest rhythm.',
      'Define a simple subscription offer and fixed delivery window.',
    ],
  },
  {
    days: 'Days 11-20',
    title: 'Sampling',
    tasks: [
      'Harvest first batch and package by weight.',
      'Share tray and harvest photos in local groups.',
      'Give samples to new prospects and collect feedback.',
      'Follow up with a clear reorder message each cycle.',
    ],
  },
  {
    days: 'Days 21-30',
    title: 'First Sales',
    tasks: [
      'Convert sample users into weekly subscribers.',
      'Keep ordering flow minimal and predictable.',
      'Deliver on the same day every week to build trust.',
      'Scale slowly only when demand is stable.',
    ],
  },
];

const RHYTHM = [
  {
    step: 'Step 1',
    title: 'Plant Day',
    detail: 'Soak larger seeds, sow trays, label and stack with weight.',
    icon: '🌱',
  },
  {
    step: 'Step 2',
    title: 'Blackout Phase',
    detail: 'Keep weighted trays in darkness and monitor moisture and airflow.',
    icon: '🌑',
  },
  {
    step: 'Step 3',
    title: 'Light & Water',
    detail: 'Run lights 18/6 and bottom water daily with fan circulation.',
    icon: '☀️',
  },
  {
    step: 'Step 4',
    title: 'Harvest Day',
    detail: 'Cut above soil, weigh by container target and package immediately.',
    icon: '✂️',
  },
  {
    step: 'Step 5',
    title: 'Delivery Day',
    detail: 'Deliver on a fixed weekly day and reinforce subscription habit.',
    icon: '🚚',
  },
];

function loadSavedTracker(cropId, taskCount) {
  try {
    const raw = localStorage.getItem(`${TRACKER_STORAGE_KEY}_${cropId}`);
    if (!raw) return Array(taskCount).fill(false);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Array(taskCount).fill(false);
    return Array(taskCount)
      .fill(false)
      .map((_, i) => Boolean(parsed[i]));
  } catch {
    return Array(taskCount).fill(false);
  }
}

export default function Microgreens() {
  const [activeTab, setActiveTab] = useState('core');
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [taskState, setTaskState] = useState([]);

  const selectedCrop = useMemo(
    () => TRACKER_CROPS.find((crop) => crop.id === selectedCropId) || null,
    [selectedCropId]
  );

  const selectedTasks = useMemo(() => {
    if (!selectedCrop) return [];
    return selectedCrop.phases.flatMap((phase, phaseIndex) =>
      phase.tasks.map((task, taskIndex) => ({ ...task, phaseIndex, taskIndex }))
    );
  }, [selectedCrop]);

  useEffect(() => {
    if (!selectedCrop) {
      setTaskState([]);
      return;
    }
    setTaskState(loadSavedTracker(selectedCrop.id, selectedTasks.length));
  }, [selectedCrop, selectedTasks.length]);

  useEffect(() => {
    if (!selectedCrop || taskState.length === 0) return;
    localStorage.setItem(`${TRACKER_STORAGE_KEY}_${selectedCrop.id}`, JSON.stringify(taskState));
  }, [selectedCrop, taskState]);

  const doneCount = taskState.filter(Boolean).length;
  const remainingCount = Math.max(selectedTasks.length - doneCount, 0);
  const progress = selectedTasks.length
    ? Math.round((doneCount / selectedTasks.length) * 100)
    : 0;

  const activeSeedTable = SEEDING_TABS[activeTab];

  const toggleTask = (index) => {
    setTaskState((prev) => prev.map((done, i) => (i === index ? !done : done)));
  };

  const resetTracker = () => {
    if (!selectedCrop) return;
    setTaskState(Array(selectedTasks.length).fill(false));
    localStorage.removeItem(`${TRACKER_STORAGE_KEY}_${selectedCrop.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-green-700">Microgreens Hub</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">Vilva Microgreens Program</h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Imported from your latest microgreens app concept and adapted to match this admin panel style.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-green-900 bg-gradient-to-br from-green-950 via-green-900 to-green-800 p-6 text-green-50 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-green-300">Waterloo, Ontario · Weekly Fresh</p>
        <h3 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">Nutrient-Dense Microgreens</h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-green-100/90 sm:text-base">
          Grow, track and deliver consistent microgreens with a simple weekly rhythm. This page combines crop strategy,
          seeding references and a practical day-by-day checklist.
        </p>
        <div className="mt-6 grid gap-3 text-center sm:grid-cols-4">
          <div className="rounded-lg border border-green-700/60 bg-green-950/40 px-4 py-3">
            <p className="text-2xl font-bold text-green-200">6</p>
            <p className="text-xs uppercase tracking-[0.15em] text-green-300">sq ft to start</p>
          </div>
          <div className="rounded-lg border border-green-700/60 bg-green-950/40 px-4 py-3">
            <p className="text-2xl font-bold text-green-200">30</p>
            <p className="text-xs uppercase tracking-[0.15em] text-green-300">days to first sale</p>
          </div>
          <div className="rounded-lg border border-green-700/60 bg-green-950/40 px-4 py-3">
            <p className="text-2xl font-bold text-green-200">10</p>
            <p className="text-xs uppercase tracking-[0.15em] text-green-300">hrs/week max</p>
          </div>
          <div className="rounded-lg border border-green-700/60 bg-green-950/40 px-4 py-3">
            <p className="text-2xl font-bold text-green-200">5</p>
            <p className="text-xs uppercase tracking-[0.15em] text-green-300">core crops</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-green-700">Our Crops</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">The Core Five</h3>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Focused crop selection creates predictable harvest quality and easier weekly operations.
            </p>
          </div>
          <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm italic text-green-900">
            Consistency creates repeat customers.
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CORE_CROPS.map((crop) => (
            <article key={crop.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:border-green-300 hover:bg-white">
              <p className="text-3xl">{crop.emoji}</p>
              <h4 className="mt-2 text-lg font-semibold text-gray-900">{crop.name}</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {crop.pills.map((pill) => (
                  <span key={pill} className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-medium text-green-800">
                    {pill}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">{crop.description}</p>
              <div className="mt-4 border-t border-gray-200 pt-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Avg Yield / 1020 Tray</p>
                <p className="text-xl font-bold text-green-800">{crop.avgYield}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-green-700">Seeding Reference</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">Seed Density and Timing Guide</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SEEDING_TABS).map(([tabKey, tab]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                  activeTab === tabKey
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {activeSeedTable.columns.map((column) => (
                  <th key={column} className="whitespace-nowrap px-3 py-3 text-left text-[11px] uppercase tracking-[0.12em] text-gray-600">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {activeSeedTable.rows.map((row, rowIndex) => (
                <tr key={`${activeTab}-row-${rowIndex}`} className="hover:bg-green-50/40">
                  {row.map((cell, cellIndex) => (
                    <td key={`${activeTab}-${rowIndex}-${cellIndex}`} className="whitespace-nowrap px-3 py-2.5 text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-green-700">The Journey</p>
        <h3 className="mt-1 text-2xl font-bold text-gray-900">30-Day Roadmap to First Sales</h3>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {ROADMAP.map((phase, idx) => (
            <article key={phase.title} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-[11px] uppercase tracking-[0.15em] text-green-700">{phase.days}</p>
              <h4 className="mt-1 text-lg font-semibold text-gray-900">{phase.title}</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                {phase.tasks.map((task) => (
                  <li key={task} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
              <span className="pointer-events-none absolute -right-3 -top-8 text-8xl font-bold text-green-100">{idx + 1}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-green-800 bg-green-900 p-5 text-green-50 shadow-sm sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-green-300">Bonus Recipe</p>
            <h3 className="mt-1 text-2xl font-bold">Super Soil Formula</h3>
            <p className="mt-3 text-sm leading-7 text-green-100/90">
              Per gallon of medium: 1 gallon Pro-Mix HP + 30-40g Gaia Green 4-4-4. This recipe supports stable growth quality
              across the core crops and reduces variability between cycles.
            </p>
          </div>
          <div className="rounded-lg border border-green-700/70 bg-green-950/30 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-green-800/70 pb-3">
                <div>
                  <p className="text-lg font-semibold">Pro-Mix HP</p>
                  <p className="text-xs text-green-300">High porosity base medium</p>
                </div>
                <p className="text-xl font-bold text-amber-300">1 gal</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">Gaia Green 4-4-4</p>
                  <p className="text-xs text-green-300">Organic all-purpose fertilizer</p>
                </div>
                <p className="text-xl font-bold text-amber-300">30-40g</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-green-700">Operations</p>
        <h3 className="mt-1 text-2xl font-bold text-gray-900">Weekly Growing Rhythm</h3>
        <div className="mt-4 space-y-2">
          {RHYTHM.map((item) => (
            <div key={item.title} className="grid gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-green-300 hover:bg-green-50/40 sm:grid-cols-[90px_1fr_40px] sm:items-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-green-700">{item.step}</p>
              <div>
                <p className="text-base font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600">{item.detail}</p>
              </div>
              <p className="text-2xl sm:text-right">{item.icon}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-green-700">Crop Growing Tracker</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">Vilva Grow Tracker</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-gray-200 px-3 py-2 text-center">
              <p className="text-lg font-bold text-green-700">{doneCount}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Done</p>
            </div>
            <div className="rounded-lg border border-gray-200 px-3 py-2 text-center">
              <p className="text-lg font-bold text-gray-700">{remainingCount}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Remaining</p>
            </div>
            <button
              type="button"
              onClick={resetTracker}
              disabled={!selectedCrop}
              className="rounded-lg border border-green-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {TRACKER_CROPS.map((crop) => (
            <button
              key={crop.id}
              type="button"
              onClick={() => setSelectedCropId(crop.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                selectedCropId === crop.id
                  ? 'border-green-700 bg-green-700 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-400 hover:text-green-800'
              }`}
            >
              {crop.emoji} {crop.name}
            </button>
          ))}
        </div>

        {selectedCrop ? (
          <>
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl">{selectedCrop.emoji}</p>
                  <h4 className="text-lg font-semibold text-green-900">{selectedCrop.name}</h4>
                  <p className="mt-1 text-sm text-green-800/90">{selectedCrop.notes}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-5">
                  <div>
                    <p className="text-base font-bold text-green-900">{selectedCrop.sow}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-green-700">Sow</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-green-900">{selectedCrop.growTime}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-green-700">Grow</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-green-900">{selectedCrop.avgYield}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-green-700">Yield</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-green-900">{selectedCrop.weight}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-green-700">Weight</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-green-900">{selectedCrop.blackout}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-green-700">Blackout</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-gray-600">
                <span>{selectedCrop.name} progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {selectedCrop.phases.map((phase, phaseIndex) => (
                <div key={`${selectedCrop.id}-${phase.name}`} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-800">
                      {phase.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">{phase.name}</p>
                  </div>
                  <div className="space-y-2">
                    {phase.tasks.map((task, taskIndex) => {
                      const flatIndex = selectedCrop.phases
                        .slice(0, phaseIndex)
                        .reduce((acc, p) => acc + p.tasks.length, 0) + taskIndex;
                      const done = Boolean(taskState[flatIndex]);
                      return (
                        <button
                          key={`${selectedCrop.id}-${phaseIndex}-${task.day}-${task.title}`}
                          type="button"
                          onClick={() => toggleTask(flatIndex)}
                          className={`w-full rounded-lg border p-3 text-left transition ${
                            done
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/30'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border text-center text-xs leading-5 ${
                                done ? 'border-green-700 bg-green-700 text-white' : 'border-gray-300 bg-white text-transparent'
                              }`}
                            >
                              ✓
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500">{task.day}</p>
                              <p className={`text-sm ${done ? 'text-green-900 line-through' : 'text-gray-800'}`}>{task.title}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-4xl">🌱</p>
            <p className="mt-2 text-lg font-semibold text-gray-800">Choose a crop to begin tracking</p>
            <p className="mt-1 text-sm text-gray-600">Each crop includes phase-based actions aligned to its seeding and harvest timing.</p>
          </div>
        )}
      </section>
    </div>
  );
}
