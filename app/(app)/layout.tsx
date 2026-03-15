import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { FeedbackLinks } from "@/components/feedback-links";
import { PageVisitTracker } from "@/components/page-visit-tracker";
import { YearlyPromoBannerWithData } from "@/components/yearly-promo";
import { getAuthUser } from "@/lib/get-user";
import {
  buildYearlyPromoOffer,
  getInactiveYearlyPromoOffer,
} from "@/lib/yearly-promo";
import { AppPageTransition } from "./app-transition";

export const metadata: Metadata = {
  title: {
    default: "Любимая Дача",
    template: "%s | Любимая Дача",
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser().catch(() => null);
  const initialOffer = user
    ? buildYearlyPromoOffer(user)
    : getInactiveYearlyPromoOffer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950 pb-20">
      <PageVisitTracker />
      <AppHeader />
      <FeedbackLinks />
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <YearlyPromoBannerWithData
          initialOffer={initialOffer}
          compact
          ctaHref="/subscribe"
        />
      </div>
      <main className="max-w-5xl mx-auto px-4 pt-6">
        <AppPageTransition>{children}</AppPageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
