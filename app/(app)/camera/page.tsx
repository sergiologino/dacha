"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Camera, RefreshCw, Loader2 } from "lucide-react";
import { ShareIcon, CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubscribeModal } from "@/components/subscribe-modal";

interface AnalysisItem {
  id: string;
  imageUrl: string;
  result: string;
  date: string;
}

export default function CameraPage() {
  const { status } = useSession();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [freeLeft, setFreeLeft] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [sharedOk, setSharedOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/auth/signin");
  }, [status]);

  useEffect(() => {
    fetch("/api/ai/analyze")
      .then((r) => r.json())
      .then((data) => {
        if (data.analyses) setAnalyses(data.analyses);
        if (typeof data.freeLeft === "number") {
          if (data.freeLeft === -1) {
            setIsPremium(true);
          } else {
            setFreeLeft(data.freeLeft);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

    if (!isPremium && freeLeft !== null && freeLeft <= 0) {
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
      if (!response.ok) throw new Error(data.error);

      const result =
        data.result || "Не удалось распознать. Попробуй другое фото.";

      const newAnalysis: AnalysisItem = {
        id: data.analysisId || Date.now().toString(),
        imageUrl: selectedImage,
        result,
        date: new Date().toLocaleDateString("ru-RU"),
      };

      setAnalyses((prev) => [newAnalysis, ...prev]);

      if (!isPremium && freeLeft !== null) {
        setFreeLeft(freeLeft - 1);
      }
    } catch {
      alert("Ошибка анализа. Проверьте интернет-соединение.");
    } finally {
      setSelectedImage(null);
      setIsAnalyzing(false);
    }
  };

  const shareAnalysis = async (a: AnalysisItem) => {
    setSharingId(a.id);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "analysis",
          data: { imageUrl: a.imageUrl, result: a.result, date: a.date },
        }),
      });
      const json = await res.json();
      if (json.url) {
        await navigator.clipboard.writeText(json.url);
        setSharedOk(a.id);
        setTimeout(() => setSharedOk(null), 2000);
      }
    } catch {
      alert("Не удалось создать ссылку");
    } finally {
      setSharingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Фото-анализ болезней</h1>
        {!isPremium && freeLeft !== null && (
          <p className="text-sm text-emerald-600">
            Бесплатно осталось: {freeLeft} из 3 анализов в месяц
          </p>
        )}

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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-500">{a.date}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shareAnalysis(a)}
                    disabled={sharingId === a.id}
                    className="text-emerald-600"
                  >
                    {sharedOk === a.id ? (
                      <>
                        <CheckIcon className="w-4 h-4 mr-1" /> Скопировано
                      </>
                    ) : (
                      <>
                        <ShareIcon className="w-4 h-4 mr-1" /> Поделиться
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-emerald-700 dark:text-emerald-400">
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
