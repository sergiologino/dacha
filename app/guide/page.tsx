import { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { crops } from "@/lib/data/crops";
import { GuideSearch } from "./guide-search";

export const metadata: Metadata = {
  title: "Справочник растений — ДачаAI",
  description:
    "Справочник садовых и огородных культур России: томаты, огурцы, картофель, ягоды и другие. Как сажать, ухаживать, поливать — советы от AI-агронома.",
  keywords:
    "справочник растений, огород, дача, как сажать помидоры, полив огурцов, выращивание картофеля",
};

export default function GuidePage() {
  const categories = [...new Set(crops.map((c) => c.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">
          Справочник растений для дачи
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {crops.length} культур с рекомендациями по выращиванию в российских регионах
        </p>

        <GuideSearch crops={crops} />

        {categories.map((cat) => (
          <section key={cat} className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">{cat}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {crops
                .filter((c) => c.category === cat)
                .map((c) => (
                  <Link key={c.id} href={`/guide/${c.slug}`}>
                    <Card className="p-6 hover:scale-[1.02] transition-all cursor-pointer h-full">
                      <h3 className="font-semibold text-lg">{c.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{c.note}</p>
                      <p className="text-xs text-emerald-600 mt-3">
                        Полив: {c.water}
                      </p>
                    </Card>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
