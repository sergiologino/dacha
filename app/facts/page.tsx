import { Metadata } from "next";
import { FactsContent } from "./facts-content";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Интересные факты о растениях — Любимая Дача",
  description:
    "Интересные факты о растениях, огороде и даче: короткие заметки о культурах, урожае, истории и природе без лишней энциклопедичности.",
  keywords:
    "интересные факты о растениях, факты о даче, факты об огороде, садоводство",
  alternates: {
    canonical: absoluteUrl("/facts"),
  },
};

export default function FactsPage() {
  return <FactsContent />;
}
