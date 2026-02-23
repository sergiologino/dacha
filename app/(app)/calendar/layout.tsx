import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Календарь дачника",
  description: "Календарь посадок, сезонные задачи и лунный календарь для садоводов и огородников.",
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
