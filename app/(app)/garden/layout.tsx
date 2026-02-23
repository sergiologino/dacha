import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мой огород",
  description: "Управление грядками и растениями на вашем участке. Добавляйте грядки, ведите учёт посадок.",
};

export default function GardenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
