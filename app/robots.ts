import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/guide",
          "/guide/*",
          "/facts",
          "/gallery",
          "/gallery/*",
          "/kogda-sazhat-rassadu",
          "/kogda-sazhat-rassadu/vse-sovety",
          "/kalendar-posadok-2026",
          "/kalendar-posadok-2026/vse-sovety",
          "/spravochnik-udobreniy-i-zashchity",
          "/llms.txt",
          "/llms-full.txt",
        ],
        disallow: [
          "/garden",
          "/calendar",
          "/camera",
          "/subscribe",
          "/api/",
          "/auth/",
          "/settings",
        ],
      },
    ],
    sitemap: "https://dacha-ai.ru/sitemap.xml",
  };
}
