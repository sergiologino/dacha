"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  position: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
}

const defaultCenter: [number, number] = [55.751, 37.618]; // Moscow

export default function MapComponent({ position, onMapClick }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: position ? [position.lat, position.lng] : defaultCenter,
      zoom: position ? 12 : 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current) return;

    if (position) {
      if (markerRef.current) {
        markerRef.current.setLatLng([position.lat, position.lng]);
      } else {
        const icon = L.divIcon({
          html: `<div style="width:32px;height:32px;background:#059669;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        markerRef.current = L.marker([position.lat, position.lng], { icon }).addTo(mapRef.current);
      }
      mapRef.current.setView([position.lat, position.lng], 12, { animate: true });
    }
  }, [position]);

  return <div ref={containerRef} className="w-full h-full" />;
}
