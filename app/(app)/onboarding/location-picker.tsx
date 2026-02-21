"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./map-component"), { ssr: false });

interface LocationPickerProps {
  onConfirm: (lat: number, lng: number) => void;
}

export function LocationPicker({ onConfirm }: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Геолокация не поддерживается вашим браузером");
      return;
    }

    setIsDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        setIsDetecting(false);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`
          );
          const data = await res.json();
          const parts = [];
          if (data.address?.state) parts.push(data.address.state);
          if (data.address?.county) parts.push(data.address.county);
          if (data.address?.city || data.address?.town || data.address?.village)
            parts.push(data.address.city || data.address.town || data.address.village);
          setLocationName(parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(",") || "");
        } catch {
          setLocationName(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
        }
      },
      (err) => {
        setIsDetecting(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Доступ к местоположению запрещён. Укажите место на карте вручную.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Местоположение недоступно. Попробуйте указать на карте.");
            break;
          default:
            setError("Не удалось определить местоположение. Укажите на карте.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition({ lat, lng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`
      );
      const data = await res.json();
      const parts = [];
      if (data.address?.state) parts.push(data.address.state);
      if (data.address?.county) parts.push(data.address.county);
      if (data.address?.city || data.address?.town || data.address?.village)
        parts.push(data.address.city || data.address.town || data.address.village);
      setLocationName(parts.join(", ") || "");
    } catch {
      setLocationName(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={detectLocation}
        disabled={isDetecting}
        className="w-full h-12 rounded-2xl"
      >
        {isDetecting ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Navigation className="w-5 h-5 mr-2" />
        )}
        {isDetecting ? "Определяем..." : "Определить автоматически"}
      </Button>

      {error && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-3 rounded-xl">
          {error}
        </p>
      )}

      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height: isMobile ? 300 : 400 }}>
        <MapComponent
          position={position}
          onMapClick={handleMapClick}
        />
      </div>

      {!isMobile && (
        <p className="text-xs text-slate-400 text-center">
          Кликните на карте, чтобы уточнить место вашего участка
        </p>
      )}

      {position && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                {locationName || "Загрузка адреса..."}
              </p>
              <p className="text-xs text-slate-500">
                {position.lat.toFixed(4)}°N, {position.lng.toFixed(4)}°E
              </p>
            </div>
          </div>
        </Card>
      )}

      <Button
        size="lg"
        disabled={!position}
        onClick={() => position && onConfirm(position.lat, position.lng)}
        className="w-full h-14 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-lg disabled:opacity-50"
      >
        Подтвердить местоположение
      </Button>
    </div>
  );
}
