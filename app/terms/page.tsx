import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Условия использования сервиса Любимая Дача.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsPage() {
  return <LegalDocument fileName="TERMS_OF_USE.md" />;
}
