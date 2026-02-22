"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Sprout, Crown } from "lucide-react";
import { ShareIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export function AppHeader() {
  const { data: session } = useSession();

  const shareApp = async () => {
    const url = window.location.origin;
    const text = "ДачаAI — умный помощник для вашей дачи. AI-агроном, справочник, календарь.";

    if (navigator.share) {
      try {
        await navigator.share({ title: "ДачаAI", text, url });
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
    <header className="max-w-5xl mx-auto pt-4 px-4 flex justify-between items-center">
      <Link href="/garden" className="flex items-center gap-3">
        <Sprout className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
          ДачаAI
        </span>
      </Link>
      <div className="flex items-center gap-2">
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
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex items-center gap-1 border-emerald-600 text-emerald-600"
        >
          <Link href="/subscribe">
            <Crown className="w-4 h-4" /> Премиум
          </Link>
        </Button>
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
