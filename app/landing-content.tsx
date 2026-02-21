"use client";

import Link from "next/link";
import {
  Sprout,
  Calendar as CalendarIcon,
  Camera,
  BookOpen,
  WifiOff,
  Sun,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  MotionDiv,
  StaggerContainer,
  StaggerItem,
  motion,
} from "@/components/motion";

const features = [
  {
    icon: CalendarIcon,
    title: "Календарь работ",
    description: "Что сажать и когда — персонально для вашего региона и погоды",
    color: "emerald",
  },
  {
    icon: Camera,
    title: "AI фото-анализ",
    description: "Сфотографируй лист — ИИ определит болезнь и подскажет лечение",
    color: "amber",
  },
  {
    icon: BookOpen,
    title: "Справочник культур",
    description: "100+ растений с подробными рекомендациями по выращиванию в РФ",
    color: "violet",
  },
  {
    icon: WifiOff,
    title: "Работает без интернета",
    description: "Полный оффлайн на даче. Синхронизация при появлении сети",
    color: "blue",
  },
  {
    icon: Sun,
    title: "Прогноз по погоде",
    description: "Срочные уведомления: закрой теплицу, пора поливать, заморозки",
    color: "orange",
  },
  {
    icon: Shield,
    title: "Freemium",
    description: "Базовые функции бесплатно. Премиум AI-анализ от 199 ₽/мес",
    color: "teal",
  },
];

const colorMap: Record<string, string> = {
  emerald: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400",
  blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
  teal: "bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400",
};

export function LandingContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-4 pt-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
          >
            <Sprout className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
            ДачаAI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild>
            <Link href="/guide">Справочник</Link>
          </Button>
          <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/auth/signin">Войти</Link>
          </Button>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-20 text-center">
        <MotionDiv variant="fadeUp" duration={0.6}>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
            Умный помощник
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              для вашей дачи
            </span>
          </h1>
        </MotionDiv>
        <MotionDiv variant="fadeUp" delay={0.15}>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-10">
            AI-агроном в кармане: календарь по региону, анализ болезней по фото,
            справочник растений. Работает даже без интернета.
          </p>
        </MotionDiv>
        <MotionDiv variant="fadeUp" delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="h-14 px-8 text-lg rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              <Link href="/auth/signin">
                Начать бесплатно <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg rounded-3xl">
              <Link href="/guide">Открыть справочник</Link>
            </Button>
          </div>
        </MotionDiv>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <MotionDiv variant="fadeUp" className="text-center mb-12">
          <h2 className="text-3xl font-bold">Всё для богатого урожая</h2>
        </MotionDiv>
        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <Card className="p-6 hover:scale-[1.02] transition-all group h-full">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform ${colorMap[f.color]}`}
                  >
                    <f.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {f.description}
                    </p>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <MotionDiv variant="scaleIn">
          <Card className="p-10 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none">
            <h2 className="text-3xl font-bold mb-4">
              Присоединяйтесь к 14 млн дачников
            </h2>
            <p className="text-emerald-100 mb-8 text-lg">
              Бесплатный календарь, справочник и 3 AI-анализа в месяц
            </p>
            <Button
              size="lg"
              asChild
              className="h-14 px-8 text-lg rounded-3xl bg-white text-emerald-700 hover:bg-emerald-50"
            >
              <Link href="/auth/signin">Начать бесплатно</Link>
            </Button>
          </Card>
        </MotionDiv>
      </section>

      {/* Footer */}
      <MotionDiv variant="fadeIn">
        <footer className="border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 py-8 flex justify-between items-center text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4" />
              ДачаAI © {new Date().getFullYear()}
            </div>
          <div className="flex gap-6">
            <Link href="/guide" className="hover:text-emerald-600">
              Справочник
            </Link>
            <Link href="/facts" className="hover:text-emerald-600">
              Интересные факты
            </Link>
          </div>
          </div>
        </footer>
      </MotionDiv>
    </div>
  );
}
