import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

type PoiCategory = 'Special' | 'Paesi' | 'Spiagge' | 'Attrazioni';

type Poi = {
  id: string;
  name: string;
  category: PoiCategory;
  lat?: number;
  lng?: number;
  address?: string;
  note?: string;
};

const POIS: Poi[] = [
  {
    id: 'dc30-hotel',
    name: 'DC-30 Hotel',
    category: 'Special',
    address: 'Island Home Fuerteventura, C. Abubilla, 35660 Corralejo, Las Palmas, Spagna',
    note: 'Base 🏨',
  },
  {
    id: 'circociaccio-house',
    name: 'CIRCOCIACCIO HOUSE',
    category: 'Special',
    address: 'OÚM, Cl. Majanicho, 35, 35650 La Oliva, Las Palmas, Spagna',
    note: 'Casa 🏠',
  },
  { id: 'corralejo', name: 'Corralejo', category: 'Paesi', lat: 28.7397, lng: -13.8680, note: 'Nord – vibe, locali, dunes vicine' },
  { id: 'puerto-del-rosario', name: 'Puerto del Rosario', category: 'Paesi', lat: 28.5004, lng: -13.8627, note: 'Capitale' },
  { id: 'el-cotillo', name: 'El Cotillo', category: 'Paesi', lat: 28.6818, lng: -14.0096, note: 'Tramonti + lagune' },
  { id: 'betancuria', name: 'Betancuria', category: 'Paesi', lat: 28.4246, lng: -14.0564, note: 'Borgo storico in montagna' },
  { id: 'costa-calma', name: 'Costa Calma', category: 'Paesi', lat: 28.1617, lng: -14.2287 },
  { id: 'morro-jable', name: 'Morro Jable', category: 'Paesi', lat: 28.0506, lng: -14.3556 },

  { id: 'dunas-corralejo', name: 'Dunas de Corralejo', category: 'Attrazioni', lat: 28.7176, lng: -13.8450, note: 'Dune + vista Oceano' },
  { id: 'calderon-hondo', name: 'Calderón Hondo (cratere)', category: 'Attrazioni', lat: 28.6094, lng: -13.9756, note: 'Trekking facile' },
  { id: 'ajuy-caves', name: 'Cuevas de Ajuy', category: 'Attrazioni', lat: 28.3922, lng: -14.1569, note: 'Grotte + paesino' },
  { id: 'cofete', name: 'Playa de Cofete', category: 'Spiagge', lat: 28.1131, lng: -14.3590, note: 'Wild (strada sterrata)' },
  { id: 'sotavento', name: 'Playa de Sotavento', category: 'Spiagge', lat: 28.1345, lng: -14.2979, note: 'Kite / laguna con marea' },
];

function buildLinks(poi: Poi) {
  const q = encodeURIComponent(poi.name);
  const ll = poi.lat !== undefined && poi.lng !== undefined ? `${poi.lat},${poi.lng}` : null;
  const addressQ = encodeURIComponent(poi.address || poi.name);
  return {
    appleWeb: ll ? `https://maps.apple.com/?ll=${ll}&q=${q}` : `https://maps.apple.com/?q=${addressQ}`,
    googleWeb: ll ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ll)}` : `https://www.google.com/maps/search/?api=1&query=${addressQ}`,
    wazeWeb: ll ? `https://waze.com/ul?ll=${encodeURIComponent(ll)}&navigate=yes` : `https://waze.com/ul?q=${addressQ}&navigate=yes`,
  };
}

export const MappaPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [pois, setPois] = useState<Poi[]>(POIS);

  const grouped = useMemo(() => {
    const groups: Record<PoiCategory, Poi[]> = { Special: [], Paesi: [], Spiagge: [], Attrazioni: [] };
    pois.forEach((p) => groups[p.category].push(p));
    return groups;
  }, [pois]);

  // Geocode missing coords (best-effort) using OSM Nominatim.
  useEffect(() => {
    const missing = pois.filter((p) => (p.lat === undefined || p.lng === undefined) && p.address);
    if (missing.length === 0) return;

    let cancelled = false;
    const run = async () => {
      try {
        const updates: Record<string, { lat: number; lng: number }> = {};
        for (const p of missing) {
          const q = encodeURIComponent(p.address || p.name);
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!res.ok) continue;
          const data = (await res.json()) as Array<{ lat: string; lon: string }>;
          if (data?.[0]) {
            updates[p.id] = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
          }
          // small delay to be polite
          await new Promise((r) => setTimeout(r, 250));
        }
        if (cancelled) return;
        if (Object.keys(updates).length === 0) return;
        setPois((prev) =>
          prev.map((p) => {
            const u = updates[p.id];
            return u ? { ...p, lat: u.lat, lng: u.lng } : p;
          })
        );
      } catch {
        // ignore: best-effort
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [pois]);

  return (
    <div className="min-h-full bg-dark flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/5 px-4 pt-safe pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-white/5 text-gray-300"
            aria-label="Indietro"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-party-300" />
            <div className="text-sm font-semibold">Mappa – Fuerteventura</div>
          </div>
          <div className="w-8" />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Tocca un punto per aprirlo in Apple Maps / Google Maps / Waze.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 pb-28 space-y-3">
        {/* Stylized interactive map */}
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
          <MapContainer
            center={[28.35, -14.0]}
            zoom={9}
            scrollWheelZoom
            className="w-full h-[280px]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {pois
              .filter((p) => p.lat !== undefined && p.lng !== undefined)
              .map((p) => {
                const isSpecial = p.category === 'Special';
                const color = isSpecial ? '#FFE66D' : p.category === 'Spiagge' ? '#4ECDC4' : '#FF6B6B';
                const fill = isSpecial ? '#FFE66D' : color;
                return (
                  <CircleMarker
                    key={p.id}
                    center={[p.lat as number, p.lng as number]}
                    radius={isSpecial ? 10 : 7}
                    pathOptions={{
                      color,
                      weight: 2,
                      fillColor: fill,
                      fillOpacity: 0.85,
                    }}
                    eventHandlers={{
                      click: () => setSelectedPoi(p),
                    }}
                  >
                    <Popup>
                      <div className="text-sm font-semibold">{p.name}</div>
                      {p.note && <div className="text-xs opacity-80">{p.note}</div>}
                    </Popup>
                  </CircleMarker>
                );
              })}
          </MapContainer>
        </div>

        {/* POIs */}
        {(['Special', 'Paesi', 'Spiagge', 'Attrazioni'] as PoiCategory[]).map((cat) => (
          <section key={cat}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">{cat}</div>
              <div className="text-[10px] text-gray-400">{grouped[cat].length}</div>
            </div>
            <div className="space-y-2">
              {grouped[cat].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPoi(p)}
                  className="w-full text-left border-l-2 border-gray-700/40 pl-3 py-2 hover:border-coral-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-100 truncate">{p.name}</div>
                      {p.note && <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{p.note}</div>}
                      {p.lat === undefined && p.address && (
                        <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{p.address}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
                      <ExternalLink size={12} />
                      Apri
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Open in… sheet */}
      <AnimatePresence>
        {selectedPoi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end"
            onClick={() => setSelectedPoi(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full glass-strong rounded-t-3xl overflow-hidden flex flex-col mb-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Navigation size={18} className="text-party-300" />
                  <div>
                    <div className="text-base font-bold">{selectedPoi.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {selectedPoi.lat !== undefined && selectedPoi.lng !== undefined
                        ? `${selectedPoi.lat.toFixed(4)}, ${selectedPoi.lng.toFixed(4)}`
                        : selectedPoi.address || 'Coordinate non disponibili'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPoi(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Chiudi"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-4 py-4 space-y-2">
                {(() => {
                  const links = buildLinks(selectedPoi);
                  return (
                    <>
                      <a className="btn-primary w-full text-center py-3 text-sm" href={links.appleWeb} target="_blank" rel="noreferrer">
                        Apri in Apple Maps
                      </a>
                      <a className="btn-secondary w-full text-center py-3 text-sm" href={links.googleWeb} target="_blank" rel="noreferrer">
                        Apri in Google Maps
                      </a>
                      <a className="btn-ghost w-full text-center py-3 text-sm" href={links.wazeWeb} target="_blank" rel="noreferrer">
                        Apri in Waze
                      </a>
                      <p className="text-[10px] text-gray-400 text-center mt-2">
                        Suggerimento: se hai l’app installata, di solito verrà proposta automaticamente.
                      </p>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


