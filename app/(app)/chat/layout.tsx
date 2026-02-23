import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Чат с нейроэкспертом",
  description: "Задайте вопрос AI-агроному: погода, болезни растений, советы по уходу за садом и огородом.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
