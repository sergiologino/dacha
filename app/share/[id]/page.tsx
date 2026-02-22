import { Metadata } from "next";
import Link from "next/link";
import { Sprout, Bot, User, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface ShareData {
  question?: string;
  answer?: string;
  imageUrl?: string;
  result?: string;
  date?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shared = await prisma.sharedContent.findUnique({ where: { id } });
  if (!shared) return { title: "Не найдено — ДачаAI" };

  const data = shared.data as ShareData;
  const title =
    shared.type === "chat"
      ? `Вопрос нейроэксперту — ДачаAI`
      : `Фото-анализ растения — ДачаAI`;
  const description =
    shared.type === "chat"
      ? (data.question || "").substring(0, 160)
      : (data.result || "").substring(0, 160);

  return { title, description };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shared = await prisma.sharedContent.findUnique({ where: { id } });

  if (!shared) notFound();

  const data = shared.data as ShareData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <header className="max-w-3xl mx-auto px-4 pt-6 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Sprout className="w-7 h-7 text-emerald-600" />
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
            ДачаAI
          </span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {shared.type === "chat" && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold mb-6">Вопрос нейроэксперту</h1>

            {data.question && (
              <div className="flex gap-2 justify-end">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-emerald-600 text-white">
                  <p className="text-sm whitespace-pre-wrap">{data.question}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {data.answer && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white shadow-sm border border-slate-100">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {data.answer}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Нейроэксперт</p>
                </div>
              </div>
            )}
          </div>
        )}

        {shared.type === "analysis" && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Camera className="w-6 h-6 text-emerald-600" />
              Фото-анализ растения
            </h1>

            {data.imageUrl && (
              <Card className="overflow-hidden">
                <img
                  src={data.imageUrl}
                  alt="Анализ растения"
                  className="w-full rounded-t-2xl"
                />
              </Card>
            )}

            {data.result && (
              <Card className="p-6">
                <p className="text-sm text-slate-500 mb-2">{data.date}</p>
                <p className="text-emerald-700 leading-relaxed whitespace-pre-wrap">
                  {data.result}
                </p>
              </Card>
            )}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Хотите своего AI-агронома?
          </p>
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl h-12 px-6"
          >
            <Link href="/">
              <Sprout className="w-5 h-5 mr-2" />
              Попробовать ДачаAI бесплатно
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
