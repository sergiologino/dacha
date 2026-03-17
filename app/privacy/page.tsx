import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности сервиса Любимая Дача.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPage() {
  return <LegalDocument fileName="PRIVACY_POLICY.md" />;
}
