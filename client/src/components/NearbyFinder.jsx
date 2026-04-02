import React, { useState, useCallback } from 'react';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_RADIUS_M = 5000;
const GEOLOCATION_TIMEOUT_MS = 10000;
const METERS_PER_KM = 1000;

const CATEGORY_FILTERS = {
  all: { label: 'All', icon: '📍', amenities: 'doctors|hospital|clinic|school|college|kindergarten' },
  doctors: { label: 'Doctors & Clinics', icon: '🏥', amenities: 'doctors|hospital|clinic' },
  schools: { label: 'Schools', icon: '🏫', amenities: 'school|college|kindergarten' },
};

const AMENITY_LABELS = {
  doctors: 'Doctor',
  hospital: 'Hospital',
  clinic: 'Clinic',
  school: 'School',
  college: 'College',
  kindergarten: 'Kindergarten',
};

const AMENITY_ICONS = {
  doctors: '👨‍⚕️',
  hospital: '🏥',
  clinic: '🩺',
  school: '🏫',
  college: '🎓',
  kindergarten: '🧒',
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildOverpassQuery(lat, lon, radiusM, amenities) {
  return `[out:json][timeout:30];
(
  node["amenity"~"${amenities}"](around:${radiusM},${lat},${lon});
  way["amenity"~"${amenities}"](around:${radiusM},${lat},${lon});
  relation["amenity"~"${amenities}"](around:${radiusM},${lat},${lon});
);
out center tags;`;
}

function parseResults(elements, userLat, userLon) {
  return elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const tags = el.tags ?? {};
      const amenity = tags.amenity ?? '';
      return {
        id: `${el.type}-${el.id}`,
        name: tags.name ?? tags['name:en'] ?? AMENITY_LABELS[amenity] ?? 'Unknown',
        amenity,
        label: AMENITY_LABELS[amenity] ?? amenity,
        icon: AMENITY_ICONS[amenity] ?? '📍',
        phone: tags.phone ?? tags['contact:phone'] ?? tags['phone:1'] ?? null,
        address: [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city'],
        ]
          .filter(Boolean)
          .join(', '),
        website: tags.website ?? tags['contact:website'] ?? null,
        distKm: lat != null ? haversineKm(userLat, userLon, lat, lon) : null,
        lat,
        lon,
      };
    })
    .filter((p) => p.distKm != null)
    .sort((a, b) => a.distKm - b.distKm);
}

export default function NearbyFinder() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [radius, setRadius] = useState(DEFAULT_RADIUS_M);
  const [userLocation, setUserLocation] = useState(null);
  const [searchDone, setSearchDone] = useState(false);

  const search = useCallback(() => {
    setError('');
    setLoading(true);
    setSearchDone(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserLocation({ lat, lon });

        const filter = CATEGORY_FILTERS[category];
        const query = buildOverpassQuery(lat, lon, radius, filter.amenities);

        try {
          const res = await fetch(OVERPASS_URL, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
          const data = await res.json();
          const parsed = parseResults(data.elements ?? [], lat, lon);
          setPlaces(parsed);
          setSearchDone(true);
        } catch (err) {
          setError('Failed to fetch nearby places. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        setLoading(false);
        if (geoErr.code === 1) {
          setError('Location access denied. Please allow location access in your browser and try again.');
        } else {
          setError('Unable to determine your location. Please try again.');
        }
      },
      { timeout: GEOLOCATION_TIMEOUT_MS }
    );
  }, [category, radius]);

  const radiusOptions = [
    { value: 1000, label: '1 km' },
    { value: 2000, label: '2 km' },
    { value: 5000, label: '5 km' },
    { value: 10000, label: '10 km' },
    { value: 20000, label: '20 km' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6 px-4 shadow-md">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">📍 Nearby Finder</h1>
          <p className="text-blue-100 text-sm">Find doctors, hospitals &amp; schools near you</p>
        </div>
      </div>

      {/* Search Controls */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(CATEGORY_FILTERS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === key
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {val.icon} {val.label}
            </button>
          ))}
        </div>

        {/* Radius Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600 font-medium">Search radius:</span>
          <div className="flex gap-2 flex-wrap">
            {radiusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRadius(opt.value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  radius === opt.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-400 font-semibold'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={search}
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-md text-base"
        >
          {loading ? '🔍 Searching…' : '🔍 Find Nearby Places'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Location Info */}
        {userLocation && !loading && (
          <p className="text-xs text-gray-500">
            📡 Your location: {userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)}
          </p>
        )}
      </div>

      {/* Results */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        {loading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 animate-bounce">🔍</div>
            <p className="text-gray-500">Searching nearby places…</p>
          </div>
        )}

        {!loading && searchDone && places.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-gray-500">No places found within {radius / METERS_PER_KM} km.</p>
            <p className="text-gray-400 text-sm mt-1">Try increasing the search radius.</p>
          </div>
        )}

        {!loading && places.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Found <strong>{places.length}</strong> place{places.length !== 1 ? 's' : ''} within{' '}
              {radius / METERS_PER_KM} km
            </p>
            <div className="space-y-3">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-start gap-3"
                >
                  {/* Icon + Type */}
                  <div className="flex-shrink-0 text-center sm:text-left">
                    <span className="text-3xl">{place.icon}</span>
                    <p className="text-xs text-gray-400 mt-1">{place.label}</p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-base leading-tight">{place.name}</h3>
                    {place.address && (
                      <p className="text-gray-500 text-sm mt-0.5 truncate">{place.address}</p>
                    )}
                    <p className="text-blue-600 text-xs font-medium mt-1">
                      📏 {place.distKm < 1
                        ? `${Math.round(place.distKm * METERS_PER_KM)} m away`
                        : `${place.distKm.toFixed(1)} km away`}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                    {place.phone ? (
                      <a
                        href={`tel:${place.phone.replace(/\s+/g, '')}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                      >
                        📞 Call
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed">
                        📵 No number
                      </span>
                    )}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}&zoom=17`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      🗺️ Map
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* First-time instruction */}
        {!loading && !searchDone && !error && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">🏥🏫</div>
            <p className="text-lg font-medium text-gray-500">Click &ldquo;Find Nearby Places&rdquo; to get started</p>
            <p className="text-sm mt-2">Your browser will ask for location permission — please allow it.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pb-6">
        Powered by{' '}
        <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline">
          OpenStreetMap
        </a>{' '}
        &amp; Overpass API · Free &amp; open data
      </div>
    </div>
  );
}
