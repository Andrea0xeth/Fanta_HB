import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';

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
    lat: 28.7300,
    lng: -13.8600,
    address: 'Island Home Fuerteventura, C. Abubilla, 35660 Corralejo, Las Palmas, Spagna',
    note: 'Base 🏨',
  },
  {
    id: 'circociaccio-house',
    name: 'CIRCOCIACCIO HOUSE',
    category: 'Special',
    lat: 28.6100,
    lng: -13.9300,
    address: 'OÚM, Cl. Majanicho, 35, 35650 La Oliva, Las Palmas, Spagna',
    note: 'Casa 🏠',
  },
  // Paesi
  { id: 'corralejo', name: 'Corralejo', category: 'Paesi', lat: 28.7397, lng: -13.8680, note: 'Nord – vibe, locali, dunes vicine' },
  { id: 'puerto-del-rosario', name: 'Puerto del Rosario', category: 'Paesi', lat: 28.5004, lng: -13.8627, note: 'Capitale' },
  { id: 'el-cotillo', name: 'El Cotillo', category: 'Paesi', lat: 28.6818, lng: -14.0096, note: 'Tramonti + lagune' },
  { id: 'betancuria', name: 'Betancuria', category: 'Paesi', lat: 28.4246, lng: -14.0564, note: 'Borgo storico in montagna' },
  { id: 'costa-calma', name: 'Costa Calma', category: 'Paesi', lat: 28.1617, lng: -14.2287, note: 'Resort zona sud' },
  { id: 'morro-jable', name: 'Morro Jable', category: 'Paesi', lat: 28.0506, lng: -14.3556, note: 'Porto sud, spiagge' },
  { id: 'la-oliva', name: 'La Oliva', category: 'Paesi', lat: 28.6100, lng: -13.9300, note: 'Centro nord, Casa de los Coroneles' },
  { id: 'antigua', name: 'Antigua', category: 'Paesi', lat: 28.4231, lng: -14.0136, note: 'Centro isola, mulini' },
  { id: 'pajara', name: 'Pájara', category: 'Paesi', lat: 28.3500, lng: -14.1069, note: 'Sud, chiesa storica' },
  { id: 'tuineje', name: 'Tuineje', category: 'Paesi', lat: 28.3236, lng: -14.0478, note: 'Sud, tradizione' },
  { id: 'gran-tarajal', name: 'Gran Tarajal', category: 'Paesi', lat: 28.2119, lng: -14.0208, note: 'Porto peschereccio' },

  // Spiagge
  { id: 'cofete', name: 'Playa de Cofete', category: 'Spiagge', lat: 28.1131, lng: -14.3590, note: 'Wild (strada sterrata)' },
  { id: 'sotavento', name: 'Playa de Sotavento', category: 'Spiagge', lat: 28.1345, lng: -14.2979, note: 'Kite / laguna con marea' },
  { id: 'jandia', name: 'Playa de Jandía', category: 'Spiagge', lat: 28.0500, lng: -14.3500, note: 'Spiaggia lunga sud' },
  { id: 'esquinzo', name: 'Playa de Esquinzo', category: 'Spiagge', lat: 28.2000, lng: -14.1500, note: 'Spiaggia isolata' },
  { id: 'concha', name: 'Playa de la Concha', category: 'Spiagge', lat: 28.6800, lng: -14.0100, note: 'El Cotillo, lagune' },
  { id: 'grandes-playas', name: 'Grandes Playas', category: 'Spiagge', lat: 28.7000, lng: -13.8500, note: 'Corralejo, kite' },
  { id: 'ajuy-beach', name: 'Playa de Ajuy', category: 'Spiagge', lat: 28.3922, lng: -14.1569, note: 'Spiaggia nera, grotte' },
  { id: 'el-burro', name: 'Playa del Burro', category: 'Spiagge', lat: 28.6500, lng: -13.9500, note: 'Spiaggia tranquilla' },

  // Attrazioni
  { id: 'dunas-corralejo', name: 'Dunas de Corralejo', category: 'Attrazioni', lat: 28.7176, lng: -13.8450, note: 'Dune + vista Oceano' },
  { id: 'calderon-hondo', name: 'Calderón Hondo (cratere)', category: 'Attrazioni', lat: 28.6094, lng: -13.9756, note: 'Trekking facile' },
  { id: 'ajuy-caves', name: 'Cuevas de Ajuy', category: 'Attrazioni', lat: 28.3922, lng: -14.1569, note: 'Grotte + paesino' },
  { id: 'faro-entallada', name: 'Faro de la Entallada', category: 'Attrazioni', lat: 28.2000, lng: -14.0000, note: 'Faro panoramico' },
  { id: 'oasis-park', name: 'Oasis Park', category: 'Attrazioni', lat: 28.1500, lng: -14.2000, note: 'Zoo + camel safari' },
  { id: 'museo-queso', name: 'Museo del Queso Majorero', category: 'Attrazioni', lat: 28.4231, lng: -14.0136, note: 'Antigua, tradizione' },
  { id: 'isla-lobos', name: 'Isla de Lobos', category: 'Attrazioni', lat: 28.7500, lng: -13.8200, note: 'Isola riserva naturale' },
  { id: 'casa-coroneles', name: 'Casa de los Coroneles', category: 'Attrazioni', lat: 28.6100, lng: -13.9300, note: 'La Oliva, palazzo storico' },
  { id: 'mirador-morvelo', name: 'Mirador de Morro Velosa', category: 'Attrazioni', lat: 28.4500, lng: -14.0500, note: 'Vista panoramica' },
  { id: 'salinas-del-carmen', name: 'Salinas del Carmen', category: 'Attrazioni', lat: 28.4500, lng: -13.8500, note: 'Museo del sale' },
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

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent || '');
}

function openNativeMaps(poi: Poi) {
  const name = poi.name || poi.address || 'Destinazione';
  const hasCoords = poi.lat !== undefined && poi.lng !== undefined;

  // Android: geo: opens the native chooser (Maps/Waze/etc depending on installed apps)
  if (isAndroid()) {
    const geo = hasCoords
      ? `geo:${poi.lat},${poi.lng}?q=${encodeURIComponent(`${poi.lat},${poi.lng}(${name})`)}`
      : `geo:0,0?q=${encodeURIComponent(poi.address || name)}`;
    window.location.href = geo;
    return;
  }

  // iOS: maps:// opens Apple Maps app directly (native behavior)
  if (isIOS()) {
    const q = encodeURIComponent(poi.address || name);
    const ll = hasCoords ? `${poi.lat},${poi.lng}` : '';
    const url = hasCoords ? `maps://?ll=${ll}&q=${encodeURIComponent(name)}` : `maps://?q=${q}`;
    window.location.href = url;
    return;
  }

  // Desktop / fallback
  const links = buildLinks(poi);
  window.open(links.googleWeb, '_blank', 'noreferrer');
}

export const MappaPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [highlightedPoiId, setHighlightedPoiId] = useState<string | null>(null);
  const [pois, setPois] = useState<Poi[]>(POIS);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const poiRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<PoiCategory, Poi[]> = { Special: [], Paesi: [], Spiagge: [], Attrazioni: [] };
    pois.forEach((p) => groups[p.category].push(p));
    return groups;
  }, [pois]);

  // Richiedi posizione utente
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalizzazione non supportata dal browser');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
      },
      (error) => {
        console.error('Errore geolocalizzazione:', error);
        setLocationError('Impossibile ottenere la posizione');
      },
      options
    );
  }, []);

  // Geocode missing coords (best-effort) using OSM Nominatim.
  useEffect(() => {
    const missing = pois.filter((p) => (p.lat === undefined || p.lng === undefined) && p.address);
    if (missing.length === 0) return;

    let cancelled = false;
    const run = async () => {
      try {
        const updates: Record<string, { lat: number; lng: number }> = {};
        for (const p of missing) {
          // Aggiungi "Fuerteventura" alla query per migliorare i risultati
          const query = p.address ? `${p.address}, Fuerteventura` : `${p.name}, Fuerteventura`;
          const q = encodeURIComponent(query);
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}&countrycodes=es`;
          const res = await fetch(url, { 
            headers: { 
              'Accept': 'application/json',
              'User-Agent': 'DC-30/1.0'
            } 
          });
          if (!res.ok) continue;
          const data = (await res.json()) as Array<{ lat: string; lon: string }>;
          if (data?.[0]) {
            updates[p.id] = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
            console.log(`[Geocode] ${p.name}: ${data[0].lat}, ${data[0].lon}`);
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
      } catch (error) {
        console.error('[Geocode] Errore:', error);
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
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-gray-400">
            Tocca un punto per aprirlo in Apple Maps / Google Maps / Waze.
          </p>
          {userLocation && (
            <div className="flex items-center gap-1.5 text-[10px] text-turquoise-400">
              <div className="w-2 h-2 rounded-full bg-turquoise-400 animate-pulse"></div>
              <span>Posizione attiva</span>
            </div>
          )}
          {locationError && (
            <p className="text-[10px] text-gray-500">
              {locationError}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky Map */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 sticky top-0 z-10">
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

              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={L.divIcon({
                    className: 'user-location-marker',
                    html: `<div style="
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: #4ECDC4;
                      border: 3px solid white;
                      box-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
                    "></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  })}
                >
                  <Popup>
                    <div className="text-sm font-semibold">La tua posizione</div>
                    <div className="text-xs text-gray-500">
                      {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </div>
                  </Popup>
                </Marker>
              )}

              {pois
                .filter((p) => p.lat !== undefined && p.lng !== undefined)
                .map((p) => {
                  const isSpecial = p.category === 'Special';
                  const isHighlighted = highlightedPoiId === p.id;
                  const color = isSpecial ? '#FFE66D' : p.category === 'Spiagge' ? '#4ECDC4' : '#FF6B6B';
                  const fill = isSpecial ? '#FFE66D' : color;
                  return (
                    <CircleMarker
                      key={p.id}
                      center={[p.lat as number, p.lng as number]}
                      radius={isHighlighted ? (isSpecial ? 10 : 8) : (isSpecial ? 7 : 5)}
                      pathOptions={{
                        color: isHighlighted ? '#FF6B6B' : color,
                        weight: isHighlighted ? 2.5 : 1.5,
                        fillColor: isHighlighted ? '#FF6B6B' : fill,
                        fillOpacity: isHighlighted ? 1 : 0.85,
                      }}
                      eventHandlers={{
                        click: () => {
                          // Solo evidenziazione, non aprire modale
                          setHighlightedPoiId(p.id);
                          // Scroll to the item in the list - usa doppio timeout per assicurarsi che il DOM sia aggiornato
                          setTimeout(() => {
                            const element = poiRefs.current[p.id];
                            const container = listContainerRef.current;
                            if (element && container) {
                              // Trova tutti i parent fino al container per calcolare l'offset totale
                              let offsetTop = 0;
                              let current: HTMLElement | null = element;
                              
                              while (current && current !== container) {
                                offsetTop += current.offsetTop;
                                current = current.offsetParent as HTMLElement | null;
                              }
                              
                              // Se offsetTop è 0, prova con un approccio alternativo
                              if (offsetTop === 0) {
                                const containerRect = container.getBoundingClientRect();
                                const elementRect = element.getBoundingClientRect();
                                offsetTop = elementRect.top - containerRect.top + container.scrollTop;
                              }
                              
                              // Calcola la posizione di scroll per centrare l'elemento
                              const containerHeight = container.clientHeight;
                              const elementHeight = element.offsetHeight || element.clientHeight;
                              const scrollPosition = offsetTop - (containerHeight / 2) + (elementHeight / 2);
                              
                              // Esegui lo scroll
                              container.scrollTo({
                                top: Math.max(0, scrollPosition),
                                behavior: 'smooth'
                              });
                            }
                          }, 300);
                        },
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
        </div>

        {/* Scrollable POIs List */}
        <div 
          ref={listContainerRef}
          className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-28 space-y-3"
        >

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
                  ref={(el) => {
                    poiRefs.current[p.id] = el;
                  }}
                  onClick={() => {
                    setSelectedPoi(p);
                    setHighlightedPoiId(p.id);
                  }}
                  className={`w-full text-left border-l-2 pl-3 py-2 transition-all ${
                    highlightedPoiId === p.id
                      ? 'border-coral-500 bg-coral-500/10 scale-[1.02]'
                      : 'border-gray-700/40 hover:border-coral-500/40'
                  }`}
                  onMouseEnter={() => {
                    if (highlightedPoiId !== p.id) {
                      setHighlightedPoiId(null);
                    }
                  }}
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
                <button
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                  onClick={() => openNativeMaps(selectedPoi)}
                >
                  <Navigation size={16} />
                  Apri indicazioni
                </button>

                <button
                  className="btn-secondary w-full py-3 text-sm"
                  onClick={async () => {
                    const links = buildLinks(selectedPoi);
                    const shareUrl = links.appleWeb; // good default on iOS; works as web fallback elsewhere
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: selectedPoi.name,
                          text: selectedPoi.address || selectedPoi.name,
                          url: shareUrl,
                        });
                      } else {
                        await navigator.clipboard.writeText(shareUrl);
                        alert('Link copiato!');
                      }
                    } catch {
                      // ignore
                    }
                  }}
                >
                  Condividi / Copia link
                </button>

                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Su Android si apre il selettore app (Maps/Waze ecc). Su iPhone si apre Apple Maps.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


