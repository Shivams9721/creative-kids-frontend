"use client";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Default marker icon — Leaflet's CSS-based icon doesn't load in webpack bundles, so we point at the CDN copies.
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Recenters the map when lat/lng change from outside (e.g. user clicked Use GPS).
// Uses a wider zoom (13) when no explicit zoom is given so rural users can see
// surrounding villages and pan to the right one.
function Recenter({ lat, lng, zoom = 17 }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.setView([lat, lng], zoom, { animate: true });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

// Click anywhere on the map to drop / move the pin. Essential for rural India
// where Nominatim only resolves to block centroid and the customer's village
// isn't in the search index.
function ClickHandler({ onClick }) {
  useMapEvents({ click(e) { onClick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

export default function MapPinPicker({ lat, lng, onMove, initialZoom = 17 }) {
  const markerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);
  // India center fallback when no coordinates yet — keeps the map renderable.
  const center = (typeof lat === "number" && typeof lng === "number") ? [lat, lng] : [22.5937, 78.9629];
  const zoom = (typeof lat === "number" && typeof lng === "number") ? initialZoom : 5;

  const handleDragEnd = () => {
    const m = markerRef.current;
    if (!m) return;
    const pos = m.getLatLng();
    onMove({ lat: pos.lat, lng: pos.lng });
  };

  // Debounced map-only search — narrower than the top-level LocationSearch:
  // it ONLY moves the pin, never overwrites the user's typed address fields.
  useEffect(() => {
    if (search.length < 3) { setResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&countrycodes=in&format=json&limit=6`,
          { headers: { "Accept-Language": "en" } }
        );
        const d = await r.json();
        setResults(d || []);
      } catch { setResults([]); }
      setSearching(false);
    }, 500);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  return (
    <div className="relative">
      <div className="rounded-lg overflow-hidden border border-black/20" style={{ height: 320 }}>
        <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter lat={lat} lng={lng} zoom={initialZoom} />
          <ClickHandler onClick={onMove} />
          {typeof lat === "number" && typeof lng === "number" && (
            <Marker
              position={[lat, lng]}
              icon={icon}
              draggable
              eventHandlers={{ dragend: handleDragEnd }}
              ref={markerRef}
            />
          )}
        </MapContainer>
      </div>

      {/* Floating search bar — does not touch the address form, only re-centers the pin */}
      <div className="absolute top-2 left-2 right-2 z-[400]">
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search village, area or landmark…"
            className="w-full bg-white/95 backdrop-blur border border-black/20 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-black shadow-sm"
          />
          {searching && <span className="absolute right-3 top-2.5 text-[10px] text-black/40">Searching…</span>}
          {results.length > 0 && (
            <div className="mt-1 bg-white border border-black/15 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onMove({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
                    setSearch(r.display_name.split(",").slice(0, 3).join(","));
                    setResults([]);
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 border-b border-black/5 last:border-0"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
