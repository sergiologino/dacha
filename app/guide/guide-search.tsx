"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Crop } from "@/lib/types";

export function GuideSearch({ crops }: { crops: Crop[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!searchTerm) return (
    <div className="relative mb-8">
      <Search className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Поиск растения..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-12 pr-4 py-4 rounded-3xl border bg-white dark:bg-slate-900"
      />
    </div>
  );

  const filtered = crops.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-8">
      <div className="relative mb-4">
        <Search className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Поиск растения..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-3xl border bg-white dark:bg-slate-900"
        />
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Ничего не найдено</p>
        ) : (
          filtered.map((c) => (
            <Link key={c.id} href={`/guide/${c.slug}`}>
              <Card className="p-4 hover:scale-[1.01] transition-all cursor-pointer mb-3">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-sm text-slate-500">{c.note}</p>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
