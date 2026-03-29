"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Sprout, Crown } from "lucide-react";
import { ShareIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export function AppHeader() {
  const { data: session } = useSession();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/premium")
      .then((r) => r.json())
      .then((data) => setIsPremium(!!data.isPremium))
      .catch(() => {});
  }, [session?.user]);

  const shareApp = async () => {
    const url = window.location.origin;
    const text = "Любимая Дача — умный помощник для вашей дачи. AI-агроном, справочник, календарь.";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Любимая Дача", text, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  return (
    <header className="max-w-5xl mx-auto pt-4 px-3 sm:px-4 flex justify-between items-center gap-2 min-w-0">
      <Link href="/garden" className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
        <Sprout className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent truncate">
          Любимая Дача
        </span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={shareApp}
          title="Поделиться приложением"
          className="text-emerald-600"
        >
          <ShareIcon className="w-5 h-5" />
        </Button>
        <ThemeToggle />
        {isPremium ? (
          <span className="flex items-center justify-center w-9 h-9 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50" title="Премиум">
            <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex items-center gap-0.5 sm:gap-1 border-emerald-600 text-emerald-600 px-2 sm:px-3"
          >
            <Link href="/subscribe">
              <Crown className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Премиум</span>
            </Link>
          </Button>
        )}
        {session?.user && (
          <Link href="/settings">
            <Avatar className="w-9 h-9 ring-2 ring-emerald-200 dark:ring-emerald-800 cursor-pointer hover:ring-emerald-400 transition-all">
              <AvatarImage src={session.user.image || ""} />
              <AvatarFallback>
                {session.user.name?.[0] || "Д"}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
      </div>
    </header>
  );
}
