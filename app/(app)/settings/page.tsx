"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { MapPin, LogOut, Loader2, Save, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [togglingPremium, setTogglingPremium] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/location").then((r) => r.json()),
      fetch("/api/user/premium").then((r) => r.json()),
    ])
      .then(([loc, prem]) => {
        if (loc.latitude && loc.longitude) {
          setPosition({ lat: loc.latitude, lng: loc.longitude });
          setLocationName(loc.locationName || "");
        }
        setIsPremium(!!prem.isPremium);
        setIsAdmin(!!prem.isAdmin);
      })
      .finally(() => setLoading(false));
  }, []);

  const togglePremium = async () => {
    setTogglingPremium(true);
    try {
      const res = await fetch("/api/user/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: !isPremium }),
      });
      const data = await res.json();
      setIsPremium(data.isPremium);
      toast.success(data.isPremium ? "Премиум включён" : "Премиум отключён");
    } catch {
      toast.error("Ошибка");
    } finally {
      setTogglingPremium(false);
    }
  };

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
          <div className="mt-3 flex items-center gap-2">
            {isPremium ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Crown className="w-3 h-3 mr-1" /> Премиум
              </Badge>
            ) : (
              <Badge variant="secondary">Бесплатный</Badge>
            )}
          </div>
        </Card>
      )}

      {/* Admin: premium toggle */}
      {isAdmin && (
        <Card className="p-6 mb-6 border-amber-200 dark:border-amber-800">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-600" />
            Управление (Админ)
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Текущий статус: {isPremium ? "Премиум" : "Бесплатный"}
          </p>
          <Button
            onClick={togglePremium}
            disabled={togglingPremium}
            variant={isPremium ? "outline" : "default"}
            className={`w-full h-11 rounded-2xl ${!isPremium ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-700"}`}
          >
            {togglingPremium && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isPremium ? "Отключить Премиум" : "Включить Премиум"}
          </Button>
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
