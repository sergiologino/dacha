"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShareIcon, CheckIcon } from "@/components/icons";

export function GalleryShareButton({
  url,
  title,
  size = "sm",
  variant = "ghost",
}: {
  url: string;
  title: string;
  size?: "sm" | "icon";
  variant?: "ghost" | "outline";
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Ссылка скопирована");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleShare}
      className={size === "icon" ? "" : "rounded-xl"}
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4 mr-1" />
          {size !== "icon" && "Скопировано"}
        </>
      ) : (
        <>
          <ShareIcon className="w-4 h-4 mr-1" />
          {size !== "icon" && "Поделиться"}
        </>
      )}
    </Button>
  );
}
