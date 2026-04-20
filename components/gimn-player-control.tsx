"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Music2, Pause, Play, Sprout, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  dismissGimnSpotlightPersist,
  shouldShowGimnSpotlight,
} from "@/lib/gimn-spotlight";

const GIMN_SRC = "/gimn_dachnikov.mp3";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type GimnCtx = {
  openPlayer: () => void;
  spotlightActive: boolean;
  dismissSpotlight: () => void;
};

const GimnContext = createContext<GimnCtx | null>(null);

function useGimn(): GimnCtx {
  const ctx = useContext(GimnContext);
  if (!ctx) {
    throw new Error("Gimn player controls must be inside GimnPlayerProvider");
  }
  return ctx;
}

/** Оборачивает шапку: аудио, диалог и контекст для кнопок. */
export function GimnPlayerProvider({
  children,
  withSpotlight = true,
}: {
  children: ReactNode;
  /** На лендинге отключите, чтобы не показывать одноразовый баннер-подсказку. */
  withSpotlight?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [spotlightActive, setSpotlightActive] = useState(false);

  useEffect(() => {
    if (!withSpotlight) return;
    if (!shouldShowGimnSpotlight()) return;
    dismissGimnSpotlightPersist();
    setSpotlightActive(true);
  }, [withSpotlight]);

  const dismissSpotlight = useCallback(() => {
    setSpotlightActive(false);
  }, []);

  const openPlayer = useCallback(() => {
    setSpotlightActive(false);
    setOpen(true);
  }, []);

  const syncFromAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(a.currentTime);
    if (Number.isFinite(a.duration) && a.duration > 0) {
      setDuration(a.duration);
    }
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onLoaded = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDuration(a.duration);
      }
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", syncFromAudio);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", syncFromAudio);
    };
  }, [syncFromAudio, open]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, []);

  const seek = useCallback(
    (value: number) => {
      const a = audioRef.current;
      if (!a || !Number.isFinite(duration) || duration <= 0) return;
      a.currentTime = Math.min(Math.max(0, value), duration);
      setCurrent(a.currentTime);
    },
    [duration]
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const progressPct =
    duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  const ctxValue = useMemo(
    () => ({ openPlayer, spotlightActive, dismissSpotlight }),
    [openPlayer, spotlightActive, dismissSpotlight]
  );

  return (
    <GimnContext.Provider value={ctxValue}>
      {children}

      <audio
        ref={audioRef}
        src={GIMN_SRC}
        preload="metadata"
        className="hidden"
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md border-emerald-200/80 dark:border-emerald-800/80 bg-gradient-to-b from-emerald-50/95 via-white to-amber-50/90 dark:from-emerald-950/90 dark:via-slate-950 dark:to-amber-950/40 overflow-hidden">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-amber-400/20 dark:bg-amber-500/10 blur-2xl"
            aria-hidden
          />

          <DialogHeader className="relative z-10 text-center sm:text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/25">
              <Sprout className="h-8 w-8" aria-hidden />
            </div>
            <DialogTitle className="text-xl text-emerald-900 dark:text-emerald-100">
              Гимн дачников
            </DialogTitle>
            <DialogDescription className="text-emerald-800/80 dark:text-emerald-200/80 text-base leading-relaxed">
              Небольшой музыкальный подарок от «Любимой Дачи» — включите, когда
              хочется настроиться на грядки, рассады и тихие вечера у беседки.
            </DialogDescription>
          </DialogHeader>

          <div className="relative z-10 space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                onClick={togglePlay}
                aria-label={playing ? "Пауза" : "Воспроизвести"}
              >
                {playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <div className="flex-1 min-w-0 space-y-1">
                <input
                  type="range"
                  min={0}
                  max={duration > 0 ? duration : 1}
                  step={0.1}
                  value={duration > 0 ? current : 0}
                  onChange={(e) => seek(Number(e.target.value))}
                  disabled={duration <= 0}
                  className={cn(
                    "w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-600",
                    "bg-emerald-200/80 dark:bg-emerald-900/60",
                    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
                    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:shadow",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  aria-label="Позиция в треке"
                />
                <div className="flex justify-between text-xs tabular-nums text-emerald-700/80 dark:text-emerald-300/80">
                  <span>{formatTime(current)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            <div
              className="h-1.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/50 overflow-hidden"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-[width] duration-150 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </GimnContext.Provider>
  );
}

/** Одноразовый баннер: с 21.04.2026, пока не закрыт пользователем. */
export function GimnSpotlightBanner() {
  const { spotlightActive, dismissSpotlight, openPlayer } = useGimn();
  if (!spotlightActive) return null;

  return (
    <div
      className="mt-3 animate-in fade-in slide-in-from-top-2 duration-500"
      role="region"
      aria-label="Новинка: гимн дачников"
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-300/60 dark:border-amber-600/40 bg-gradient-to-br from-amber-50/98 via-white to-emerald-50/95 dark:from-amber-950/55 dark:via-slate-900/90 dark:to-emerald-950/50 px-3.5 py-3 sm:px-4 sm:py-3.5 pr-11 shadow-md shadow-amber-900/10 dark:shadow-black/30">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1.5 top-1.5 h-8 w-8 text-emerald-800/70 hover:text-emerald-950 dark:text-emerald-200/80"
          onClick={dismissSpotlight}
          aria-label="Закрыть подсказку"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex gap-3 min-w-0">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md gimn-spotlight-glow"
            aria-hidden
          >
            <Music2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm sm:text-base leading-snug">
              Новинка: гимн дачников в приложении
            </p>
            <p className="text-xs sm:text-sm text-emerald-900/85 dark:text-emerald-100/85 leading-relaxed">
              Мы добавили небольшую музыкальную открытку для настроения. Кнопка с
              нотой — рядом с профилем на большом экране; на телефоне чуть ниже
              названия «Любимая Дача». Эту подсказку покажем один раз — дальше
              просто включайте, когда захочется.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={openPlayer}
              >
                Слушать гимн
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-emerald-800 dark:text-emerald-200"
                onClick={dismissSpotlight}
              >
                Понятно, спасибо
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const spotlightBtnClass =
  "ring-2 ring-amber-400/90 dark:ring-amber-500/80 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 gimn-spotlight-glow relative z-[1]";

/** Иконка в строке шапки (планшеты и десктоп). */
export function GimnHeaderIconButton() {
  const { openPlayer, spotlightActive } = useGimn();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={openPlayer}
      title="Гимн дачников"
      aria-label="Открыть проигрыватель — гимн дачников"
      className={cn(
        "hidden md:inline-flex text-emerald-600 dark:text-emerald-400 shrink-0",
        "hover:bg-emerald-50 dark:hover:bg-emerald-950/50",
        spotlightActive && spotlightBtnClass
      )}
    >
      <Music2 className="w-5 h-5" aria-hidden />
    </Button>
  );
}

/** Иконка гимна для лендинга — на всех ширинах экрана. */
export function GimnLandingIconButton() {
  const { openPlayer, spotlightActive } = useGimn();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={openPlayer}
      title="Гимн дачников"
      aria-label="Открыть проигрыватель — гимн дачников"
      className={cn(
        "inline-flex shrink-0 h-9 w-9 sm:h-10 sm:w-10 text-emerald-600 dark:text-emerald-400",
        "hover:bg-emerald-100/90 dark:hover:bg-emerald-950/50",
        spotlightActive && spotlightBtnClass
      )}
    >
      <Music2 className="w-5 h-5" aria-hidden />
    </Button>
  );
}

/** Компактная кнопка под названием приложения на узких экранах. */
export function GimnMobileLaunchButton() {
  const { openPlayer, spotlightActive } = useGimn();
  return (
    <button
      type="button"
      onClick={openPlayer}
      title="Гимн дачников"
      aria-label="Открыть проигрыватель — гимн дачников"
      className={cn(
        "md:hidden flex items-center justify-center gap-2 w-full max-w-[min(100%,20rem)] mx-auto",
        "rounded-2xl border border-emerald-200/90 dark:border-emerald-800/90",
        "bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm",
        "py-2 px-3 text-sm font-medium text-emerald-800 dark:text-emerald-200",
        "shadow-sm active:scale-[0.99] transition-transform",
        spotlightActive && spotlightBtnClass
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
        <Music2 className="w-4 h-4" aria-hidden />
      </span>
      <span className="truncate">Гимн дачников</span>
    </button>
  );
}
