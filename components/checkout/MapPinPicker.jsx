"use client";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useRef } from "react";
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
  // India center fallback when no coordinates yet — keeps the map renderable.
  const center = (typeof lat === "number" && typeof lng === "number") ? [lat, lng] : [22.5937, 78.9629];
  const zoom = (typeof lat === "number" && typeof lng === "number") ? initialZoom : 5;

  const handleDragEnd = () => {
    const m = markerRef.current;
    if (!m) return;
    const pos = m.getLatLng();
    onMove({ lat: pos.lat, lng: pos.lng });
  };

  return (
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
  );
}
