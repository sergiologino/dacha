"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sprout,
  Calendar as CalendarIcon,
  Camera,
  BookOpen,
  WifiOff,
  Sun,
  Shield,
  ChevronRight,
  Users,
  Star,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedbackLinks } from "@/components/feedback-links";
import {
  MotionDiv,
  StaggerContainer,
  StaggerItem,
  motion,
} from "@/components/motion";

const USER_COUNT = "30 000";

const TESTIMONIALS = [
  {
    name: "Марина, Подмосковье",
    text: "Наконец-то перестала гадать, когда сажать. Календарь подсказывает по погоде — урожай томатов впервые как на картинке.",
    rating: 5,
  },
  {
    name: "Алексей, Ленинградская обл.",
    text: "Сфотографировал лист — приложение показало болезнь и чем лечить. За сезон спас всю рассаду.",
    rating: 5,
  },
  {
    name: "Ольга, Краснодар",
    text: "Справочник и напоминания всегда под рукой. Даже без интернета на участке всё открывается.",
    rating: 5,
  },
];

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
            Любимая Дача
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
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
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
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8">
            AI-агроном в кармане: календарь по региону, анализ болезней по фото,
            справочник растений. Работает даже без интернета.
          </p>
        </MotionDiv>
        <MotionDiv variant="fadeUp" delay={0.25}>
          <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 mb-8">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium">
              Более {USER_COUNT} дачников уже с нами
            </span>
          </div>
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
        <MotionDiv variant="fadeUp" delay={0.4} className="mt-12 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
          <Image
            src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&q=80"
            alt="Огород, зелень, дача"
            width={900}
            height={500}
            className="w-full h-56 sm:h-72 object-cover"
            priority
          />
        </MotionDiv>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <MotionDiv variant="fadeUp" className="text-center mb-12">
          <h2 className="text-3xl font-bold">Всё для богатого урожая</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
            Один сервис вместо десятка заметок и таблиц
          </p>
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

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <MotionDiv variant="fadeUp" className="text-center mb-10">
          <h2 className="text-3xl font-bold">Отзывы дачников</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Уже тысячи довольных урожаем
          </p>
        </MotionDiv>
        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <MotionDiv key={t.name} variant="fadeUp" delay={i * 0.1}>
              <Card className="p-6 h-full flex flex-col border-slate-200 dark:border-slate-700">
                <Quote className="w-8 h-8 text-emerald-500/70 mb-3" />
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">
                  «{t.text}»
                </p>
                <div className="flex items-center gap-1.5 mt-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-slate-500 ml-2">{t.name}</span>
                </div>
              </Card>
            </MotionDiv>
          ))}
        </div>
      </section>

      {/* Visual: app in context */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <MotionDiv variant="fadeUp" className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
          <Image
            src="https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=900&q=80"
            alt="Свежие овощи с огорода"
            width={900}
            height={500}
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="bg-gradient-to-t from-slate-900/90 to-transparent p-6 sm:p-8 -mt-24 relative">
            <p className="text-white text-lg sm:text-xl font-medium max-w-xl">
              Планируйте посадки, фиксируйте урожай и получайте подсказки AI — всё в одном приложении.
            </p>
          </div>
        </MotionDiv>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <MotionDiv variant="scaleIn">
          <Card className="p-10 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none shadow-xl shadow-emerald-500/20">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users className="w-6 h-6 text-white/90" />
              <span className="text-emerald-100 font-medium">
                Более {USER_COUNT} дачников уже с нами
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Присоединяйтесь к тем, кто собирает больше
            </h2>
            <p className="text-emerald-100 mb-8 text-lg">
              Бесплатный календарь, справочник и 3 AI-анализа в месяц. Премиум — без ограничений.
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
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4" />
              Любимая Дача © {new Date().getFullYear()}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/guide" className="hover:text-emerald-600">
                Справочник
              </Link>
              <Link href="/facts" className="hover:text-emerald-600">
                Интересные факты
              </Link>
              <FeedbackLinks variant="inline" />
            </div>
          </div>
        </footer>
      </MotionDiv>
    </div>
  );
}
