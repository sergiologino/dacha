import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { crops } from "@/lib/data/crops";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return crops.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const crop = crops.find((c) => c.slug === slug);
  if (!crop) return {};

  return {
    title: `${crop.name} — как выращивать на даче | ДачаAI`,
    description: crop.description || crop.note,
    keywords: `${crop.name}, выращивание, дача, огород, посадка ${crop.name.toLowerCase()}, уход`,
  };
}

export default async function CropPage({ params }: Props) {
  const { slug } = await params;
  const crop = crops.find((c) => c.slug === slug);
  if (!crop) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/guide">
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад к справочнику
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">{crop.name}</h1>
        <div className="flex gap-2 mb-6">
          <Badge variant="secondary">{crop.category}</Badge>
          {crop.region.map((r) => (
            <Badge key={r} variant="outline">
              {r}
            </Badge>
          ))}
        </div>

        {crop.description && (
          <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
            {crop.description}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-semibold text-emerald-600 mb-2">Посадка</h2>
            <p className="text-2xl font-bold">{crop.plantMonth}</p>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold text-amber-600 mb-2">Урожай</h2>
            <p className="text-2xl font-bold">{crop.harvestMonth}</p>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold text-blue-600 mb-2">Полив</h2>
            <p className="text-2xl font-bold">{crop.water}</p>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold text-violet-600 mb-2">Примечание</h2>
            <p className="text-lg">{crop.note}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
