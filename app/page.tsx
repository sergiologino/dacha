import { Metadata } from "next";
import { LandingContent } from "./landing-content";
import { JsonLd } from "@/components/json-ld";
import { auth } from "@/auth";
import { getAuthUser } from "@/lib/get-user";
import {
  buildYearlyPromoOffer,
  getInactiveYearlyPromoOffer,
} from "@/lib/yearly-promo";
import {
  absoluteUrl,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Календарь посадок 2026 и болезни растений по фото — Любимая Дача",
  description:
    "Календарь посадок по регионам России, сроки посева рассады, лунный календарь и AI-анализ болезней растений по фото. Приложение для дачников и садоводов.",
  keywords:
    "календарь посадок 2026, когда сажать рассаду, сроки посева рассады, болезни растений по фото, справочник растений, дача",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: "Календарь посадок 2026 и болезни растений по фото",
    description:
      "Сроки посева рассады, подсказки по регионам, лунный календарь и AI-анализ болезней растений.",
    type: "website",
    locale: "ru_RU",
    url: absoluteUrl("/"),
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Любимая Дача" }],
  },
  twitter: {
    card: "summary",
    title: "Календарь посадок 2026 для дачников",
    description: "Когда сажать рассаду, что сеять по месяцам и как распознать болезни растений по фото.",
  },
};

export default async function LandingPage() {
  const session = await auth();
  const user = session?.user?.email ? await getAuthUser().catch(() => null) : null;
  const initialOffer = user
    ? buildYearlyPromoOffer(user)
    : getInactiveYearlyPromoOffer();

  return (
    <>
      <JsonLd
        data={[
          buildOrganizationJsonLd(),
          buildWebsiteJsonLd(),
          buildSoftwareApplicationJsonLd(),
        ]}
      />
      <LandingContent initialOffer={initialOffer} />
    </>
  );
}
