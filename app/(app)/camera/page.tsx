"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import localforage from "localforage";
import { Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubscribeModal } from "@/components/subscribe-modal";
import type { Analysis } from "@/lib/types";

export default function CameraPage() {
  const { status } = useSession();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [freeAnalysesLeft, setFreeAnalysesLeft] = useState(3);
  const [isPremium] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/auth/signin");
  }, [status]);

  useEffect(() => {
    localforage.getItem<Analysis[]>("dacha-analyses").then((saved) => {
      if (saved) setAnalyses(saved);
    });
    localforage
      .getItem<{ count: number; resetDate: string }>("free-analyses")
      .then((saved) => {
        if (saved) {
          const now = new Date();
          const reset = new Date(saved.resetDate);
          if (
            now.getMonth() !== reset.getMonth() ||
            now.getFullYear() !== reset.getFullYear()
          ) {
            localforage.setItem("free-analyses", {
              count: 3,
              resetDate: now.toISOString(),
            });
            setFreeAnalysesLeft(3);
          } else {
            setFreeAnalysesLeft(saved.count);
          }
        }
      });
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    if (!isPremium && freeAnalysesLeft <= 0) {
      setShowSubscribeModal(true);
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: selectedImage }),
      });

      const data = await response.json();
      const result =
        data.result || "Не удалось распознать. Попробуй другое фото.";

      const newAnalysis: Analysis = {
        id: Date.now().toString(),
        imageUrl: selectedImage,
        result,
        date: new Date().toLocaleDateString("ru-RU"),
      };

      const updated = [newAnalysis, ...analyses];
      setAnalyses(updated);
      await localforage.setItem("dacha-analyses", updated);

      if (!isPremium) {
        const newCount = freeAnalysesLeft - 1;
        setFreeAnalysesLeft(newCount);
        await localforage.setItem("free-analyses", {
          count: newCount,
          resetDate: new Date().toISOString(),
        });
      }
    } catch {
      alert("Ошибка анализа. Проверьте интернет-соединение.");
    } finally {
      setSelectedImage(null);
      setIsAnalyzing(false);
    }
  };

  if (status === "loading") return null;

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Фото-анализ болезней</h1>
        <p className="text-sm text-emerald-600">
          Бесплатно осталось: {freeAnalysesLeft} анализа
        </p>

        {!selectedImage ? (
          <Card className="p-10 text-center border-dashed border-2 border-emerald-300 dark:border-emerald-700">
            <Camera className="w-16 h-16 mx-auto text-emerald-500 mb-6" />
            <p className="text-lg font-medium mb-2">Сфоткай растение</p>
            <p className="text-sm text-slate-500 mb-8">
              ИИ скажет, что не так и как лечить
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-14 rounded-3xl bg-emerald-600"
              >
                📸 Сфотографировать
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-14 rounded-3xl"
              >
                Выбрать из галереи
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <img src={selectedImage} alt="preview" className="w-full h-auto" />
            <div className="p-6">
              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full h-14 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                {isAnalyzing && <RefreshCw className="animate-spin mr-2" />}
                {isAnalyzing ? "Анализирую..." : "Анализировать с ДачаAI"}
              </Button>
            </div>
          </Card>
        )}

        <div>
          <h2 className="font-semibold mb-4">История анализов</h2>
          {analyses.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              Пока нет анализов
            </p>
          ) : (
            analyses.map((a) => (
              <Card key={a.id} className="mb-4 p-4">
                <img
                  src={a.imageUrl}
                  className="w-full rounded-2xl mb-4"
                  alt="analysis"
                />
                <p className="text-sm text-slate-500">{a.date}</p>
                <p className="mt-2 text-emerald-700 dark:text-emerald-400">
                  {a.result}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>

      <SubscribeModal
        open={showSubscribeModal}
        onOpenChange={setShowSubscribeModal}
      />
    </>
  );
}
