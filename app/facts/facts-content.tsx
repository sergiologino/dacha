"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { MotionDiv, StaggerContainer, StaggerItem } from "@/components/motion";
import { motion, AnimatePresence } from "framer-motion";
import {
  funFacts,
  factCategories,
  type FactCategory,
} from "@/lib/data/fun-facts";

const categoryColors: Record<string, string> = {
  растения: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  урожай: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  история: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  наука: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  рекорды: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
};

export function FactsContent() {
  const [activeCategory, setActiveCategory] = useState<FactCategory>("все");
  const [randomFact, setRandomFact] = useState<number | null>(null);

  const filtered =
    activeCategory === "все"
      ? funFacts
      : funFacts.filter((f) => f.category === activeCategory);

  const showRandom = () => {
    const idx = Math.floor(Math.random() * funFacts.length);
    setRandomFact(funFacts[idx].id);
    setActiveCategory("все");
    setTimeout(() => {
      document.getElementById(`fact-${funFacts[idx].id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <MotionDiv variant="fadeUp">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> На главную
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold">Интересные факты</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {funFacts.length} удивительных фактов о растениях и огородничестве
          </p>
        </MotionDiv>

        {/* Controls */}
        <MotionDiv variant="fadeUp" delay={0.1} className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {factCategories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveCategory(cat);
                  setRandomFact(null);
                }}
                className={
                  activeCategory === cat
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : ""
                }
              >
                {cat === "все" ? "Все" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={showRandom}>
            <Shuffle className="w-4 h-4 mr-2" />
            Случайный факт
          </Button>
        </MotionDiv>

        {/* Facts grid */}
        <AnimatePresence mode="popLayout">
          <StaggerContainer className="grid gap-4" staggerDelay={0.05}>
            {filtered.map((fact) => (
              <StaggerItem key={fact.id}>
                <motion.div
                  layout
                  id={`fact-${fact.id}`}
                  animate={
                    randomFact === fact.id
                      ? { scale: [1, 1.03, 1], transition: { duration: 0.4 } }
                      : {}
                  }
                >
                  <Card
                    className={`p-6 transition-all ${
                      randomFact === fact.id
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
                            className={`text-xs ${categoryColors[fact.category] || ""}`}
                          >
                            {fact.category}
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
        </AnimatePresence>

        {filtered.length === 0 && (
          <p className="text-center text-slate-500 py-12">
            Нет фактов в этой категории
          </p>
        )}

        {/* Footer link */}
        <MotionDiv variant="fadeIn" className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Хотите применить знания на практике?
          </p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl">
            <Link href="/guide">Открыть справочник растений</Link>
          </Button>
        </MotionDiv>
      </div>
    </div>
  );
}
