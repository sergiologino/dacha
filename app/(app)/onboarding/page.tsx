"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Sprout, Leaf, Sun, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocationPicker } from "./location-picker";

interface RegionData {
  name: string;
  climate: string;
  soil: string;
  frostFreeMonths: string;
  bestCrops: string[];
  report: string;
}

type Step = "welcome" | "location" | "analyzing" | "report";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLocationConfirm = async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setStep("analyzing");
    setIsAnalyzing(true);

    try {
      await fetch("/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      const res = await fetch("/api/region/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      const data = await res.json();
      setRegionData(data);
      setStep("report");
    } catch {
      alert("Ошибка анализа региона. Попробуйте ещё раз.");
      setStep("location");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinish = () => {
    router.push("/garden");
  };

  return (
    <div className="max-w-lg mx-auto">
      {step === "welcome" && (
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-6">
            <Sprout className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">
            Добро пожаловать в Любимая Дача!
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Чтобы давать точные рекомендации по посадке и уходу,
            нам нужно знать, где находится ваш участок.
          </p>

          <div className="space-y-4 text-left mb-10">
            {[
              { icon: MapPin, text: "Определим климат и тип почвы вашего региона" },
              { icon: Sun, text: "Подберём оптимальный календарь посадок" },
              { icon: Leaf, text: "Будем следить за погодой именно для вашего участка" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 pt-2">{item.text}</p>
              </div>
            ))}
          </div>

          <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-8">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              🔒 Координаты хранятся только на нашем сервере и используются
              исключительно для персонализации рекомендаций. Мы не передаём
              ваши данные третьим лицам.
            </p>
          </Card>

          <Button
            size="lg"
            onClick={() => setStep("location")}
            className="w-full h-14 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-lg"
          >
            Указать местоположение <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      {step === "location" && (
        <div className="py-4">
          <h1 className="text-2xl font-bold mb-2">Где ваш участок?</h1>
          <p className="text-slate-500 mb-6">
            Нажмите кнопку геолокации или укажите место на карте
          </p>
          <LocationPicker onConfirm={handleLocationConfirm} />
        </div>
      )}

      {step === "analyzing" && (
        <div className="text-center py-20">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Анализируем ваш регион</h1>
          <p className="text-slate-500">
            Определяем климат, почвы и лучшие культуры...
          </p>
        </div>
      )}

      {step === "report" && regionData && (
        <div className="py-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold">{regionData.name}</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="p-4">
              <p className="text-xs text-slate-500 mb-1">Климат</p>
              <p className="font-semibold text-sm">{regionData.climate}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-500 mb-1">Сезон</p>
              <p className="font-semibold text-sm">{regionData.frostFreeMonths}</p>
            </Card>
            <Card className="p-4 col-span-2">
              <p className="text-xs text-slate-500 mb-1">Почвы</p>
              <p className="font-semibold text-sm">{regionData.soil}</p>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-lg mb-3">О вашем регионе</h2>
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm">
              {regionData.report}
            </div>
          </Card>

          <div className="mb-8">
            <h2 className="font-semibold mb-3">Лучшие культуры для вас</h2>
            <div className="flex flex-wrap gap-2">
              {regionData.bestCrops.map((crop) => (
                <Badge key={crop} variant="secondary" className="text-sm py-1 px-3">
                  {crop}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleFinish}
            className="w-full h-14 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-lg"
          >
            Начать выращивать! <Sprout className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
