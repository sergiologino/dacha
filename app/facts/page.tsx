import { Metadata } from "next";
import { FactsContent } from "./facts-content";

export const metadata: Metadata = {
  title: "Интересные факты о растениях — ДачаAI",
  description:
    "25 удивительных фактов о растениях, огороде и садоводстве. Узнайте, почему морковь была фиолетовой и как тыква весит тонну.",
  keywords:
    "интересные факты, растения, огород, дача, садоводство, факты о растениях",
};

export default function FactsPage() {
  return <FactsContent />;
}
