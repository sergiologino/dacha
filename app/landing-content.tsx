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
import { FeedbackLinks, MessengerFeedbackButtons } from "@/components/feedback-links";
import {
  YearlyPromoBanner,
  useYearlyPromoOffer,
} from "@/components/yearly-promo";
import {
  MotionDiv,
  StaggerContainer,
  StaggerItem,
  motion,
} from "@/components/motion";
import {
  GimnLandingHeroButton,
  GimnPlayerProvider,
} from "@/components/gimn-player-control";
import type { YearlyPromoOffer } from "@/lib/yearly-promo";

const USER_COUNT = "30 000";

/** Локальные иллюстрации (лежат в public/images/landing/). */
const LANDING_HERO_IMAGE = "/images/landing/hero-garden.jpg";
const LANDING_VEGETABLES_IMAGE = "/images/landing/fresh-vegetables.jpg";

const TESTIMONIALS = [
  {
    name: "Марина, Подмосковье",
    text: "Перестала гадать, когда высаживать рассаду: календарь весны и погода на участке подсказали сроки — томаты впервые как на картинке.",
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
    description:
      "Апрель–июнь на грядке: что сеять, высаживать и чем заняться — с учётом региона и погоды; полный помесячный обзор — в «Все советы».",
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
    description:
      "100+ культур с сроками и уходом; отдельно — удобрения и защита от вредителей и болезней.",
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

export function LandingContent({
  initialOffer,
}: {
  initialOffer: YearlyPromoOffer;
}) {
  const { offer } = useYearlyPromoOffer({ initialOffer });

  return (
    <GimnPlayerProvider withSpotlight={false}>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-4 pt-6 flex flex-wrap justify-between items-center gap-x-2 gap-y-3"
        >
          <div className="flex items-center gap-3 min-w-0">
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
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            <MessengerFeedbackButtons size="sm" />
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm px-2 sm:px-3">
              <Link href="/guide">Справочник</Link>
            </Button>
            <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm px-2 sm:px-3">
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
            AI-агроном в кармане: календарь посадок весна–лето с учётом региона и погоды, анализ
            болезней по фото, справочник культур и материалы про удобрения и защиту растений. Работает
            даже без интернета.
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
        <MotionDiv variant="fadeUp" delay={0.32} className="mt-8 px-1">
          <GimnLandingHeroButton />
        </MotionDiv>
        <MotionDiv variant="fadeUp" delay={0.35} className="mt-6">
          <YearlyPromoBanner offer={offer} ctaHref="/subscribe" />
        </MotionDiv>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.45, ease: "easeOut" }}
          className="mt-12 relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 bg-emerald-100 dark:bg-emerald-950"
        >
          <Image
            src={LANDING_HERO_IMAGE}
            alt="Свежая зелень и огород — настроение дачного сезона"
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </motion.div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-emerald-100 dark:bg-emerald-950"
        >
          <div className="relative w-full h-64 sm:h-80">
            <Image
              src={LANDING_VEGETABLES_IMAGE}
              alt="Свежие овощи с огорода"
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
          <div className="bg-gradient-to-t from-slate-900/90 to-transparent p-6 sm:p-8 -mt-24 relative z-10">
            <p className="text-white text-lg sm:text-xl font-medium max-w-xl">
              Планируйте посев и высадку по сезону, ведите участок и получайте подсказки AI — всё в одном
              приложении.
            </p>
          </div>
        </motion.div>
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
              Бесплатный календарь посадок, справочник культур и 3 AI-анализа в месяц. Премиум — без
              ограничений.
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                href="/kogda-sazhat-rassadu"
                className="hover:text-emerald-600 dark:hover:text-emerald-400"
                title="Когда сажать и высаживать рассаду — апрель–июнь 2026; полный график посева — «Все советы»"
              >
                Рассада: весна 2026
              </Link>
              <Link
                href="/kalendar-posadok-2026"
                className="hover:text-emerald-600 dark:hover:text-emerald-400"
                title="Календарь посадок апрель–июнь 2026; расширенный обзор — «Все советы»"
              >
                Календарь: апрель–июнь
              </Link>
              <Link href="/guide" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                Справочник культур
              </Link>
              <Link
                href="/spravochnik-udobreniy-i-zashchity"
                className="hover:text-emerald-600 dark:hover:text-emerald-400"
                title="Справочник удобрений и средств защиты растений"
              >
                Удобрения и защита
              </Link>
              <Link href="/facts" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                Интересные факты
              </Link>
              <FeedbackLinks variant="icons" />
            </div>
          </div>
        </footer>
      </MotionDiv>
      </div>
    </GimnPlayerProvider>
  );
}
