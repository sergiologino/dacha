"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { motion } from "framer-motion";
import {
  FACT_FILTER_ALL,
  factCategoryBadgeClass,
  type FactFilterValue,
  type FunFactDTO,
} from "@/lib/data/fun-facts";

export type FactCategoryOption = { slug: string; title: string };

const PAGE = 8;

type Props = {
  facts: FunFactDTO[];
  categories: FactCategoryOption[];
};

export function FactsContent({ facts, categories }: Props) {
  const filterOptions: { value: FactFilterValue; label: string }[] = useMemo(
    () => [
      { value: FACT_FILTER_ALL, label: "Все" },
      ...categories.map((c) => ({ value: c.slug, label: c.title })),
    ],
    [categories]
  );

  const [activeCategory, setActiveCategory] = useState<FactFilterValue>(FACT_FILTER_ALL);
  const [randomSlug, setRandomSlug] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    if (activeCategory === FACT_FILTER_ALL) return facts;
    return facts.filter((f) => f.categorySlug === activeCategory);
  }, [facts, activeCategory]);

  const shown = filtered.slice(0, visible);
  const canMore = visible < filtered.length;

  const showRandom = () => {
    if (facts.length === 0) return;
    const pick = facts[Math.floor(Math.random() * facts.length)];
    setRandomSlug(pick.slug);
    setActiveCategory(FACT_FILTER_ALL);
    setVisible(PAGE);
    setTimeout(() => {
      document.getElementById(`fact-${pick.slug}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <MotionDiv variant="fadeUp">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold">Интересные факты</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {facts.length} удивительных фактов о растениях и огородничестве
          </p>
        </MotionDiv>

        <MotionDiv variant="fadeUp" delay={0.1} className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={activeCategory === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveCategory(opt.value);
                  setRandomSlug(null);
                  setVisible(PAGE);
                }}
                className={
                  activeCategory === opt.value ? "bg-emerald-600 hover:bg-emerald-700" : ""
                }
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={showRandom} disabled={facts.length === 0}>
            <Shuffle className="w-4 h-4 mr-2" />
            Случайный факт
          </Button>
        </MotionDiv>

        <StaggerContainer
          key={activeCategory}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.05}
        >
          {shown.map((fact) => (
            <StaggerItem key={fact.slug}>
              <motion.div
                id={`fact-${fact.slug}`}
                animate={
                  randomSlug === fact.slug
                    ? { scale: [1, 1.03, 1], transition: { duration: 0.4 } }
                    : {}
                }
              >
                <Card
                  className={`p-6 transition-all ${
                    randomSlug === fact.slug
                      ? "ring-2 ring-amber-400 shadow-lg shadow-amber-100 dark:shadow-amber-900/30"
                      : "hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl flex-shrink-0">{fact.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg">{fact.title}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${factCategoryBadgeClass(fact.categorySlug)}`}
                        >
                          {fact.categoryTitle}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {fact.text}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-12">Нет фактов в этой категории</p>
        ) : null}

        {canMore ? (
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setVisible((v) => Math.min(v + PAGE, filtered.length))}
            >
              Показать ещё 8
            </Button>
          </div>
        ) : null}

        <MotionDiv variant="fadeIn" className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-4">Хотите применить знания на практике?</p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl">
            <Link href="/guide">Открыть справочник растений</Link>
          </Button>
        </MotionDiv>
      </div>
    </div>
  );
}
