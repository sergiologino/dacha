"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { MapPin, LogOut, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const MapComponent = dynamic(
  () => import("../onboarding/map-component"),
  { ssr: false }
);

export default function SettingsPage() {
  const { data: session } = useSession();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/location")
      .then((r) => r.json())
      .then((data) => {
        if (data.latitude && data.longitude) {
          setPosition({ lat: data.latitude, lng: data.longitude });
          setLocationName(data.locationName || "");
        }
      })
      .finally(() => setLoading(false));
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

  const saveLocation = async () => {
    if (!position) return;
    setSaving(true);
    try {
      await fetch("/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.lat,
          longitude: position.lng,
          locationName,
        }),
      });

      await fetch("/api/region/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.lat,
          longitude: position.lng,
        }),
      });

      toast.success("Местоположение обновлено");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Настройки</h1>

      {session?.user && (
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-3">Профиль</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {session.user.name}
          </p>
          <p className="text-sm text-slate-500">{session.user.email}</p>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          Местоположение участка
        </h2>
        {position && (
          <p className="text-sm text-slate-500 mb-3">
            {locationName || `${position.lat.toFixed(4)}°N, ${position.lng.toFixed(4)}°E`}
          </p>
        )}

        <div
          className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-4"
          style={{ height: 300 }}
        >
          <MapComponent position={position} onMapClick={handleMapClick} />
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Кликните на карте, чтобы изменить местоположение
        </p>

        <Button
          onClick={saveLocation}
          disabled={saving || !position}
          className="w-full h-12 rounded-2xl bg-emerald-600"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Сохранить местоположение
        </Button>
      </Card>

      <Button
        variant="outline"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full h-12 rounded-2xl text-red-600 border-red-200"
      >
        <LogOut className="w-5 h-5 mr-2" /> Выйти
      </Button>
    </>
  );
}
