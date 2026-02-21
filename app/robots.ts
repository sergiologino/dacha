import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/guide", "/guide/*", "/facts"],
        disallow: ["/garden", "/calendar", "/camera", "/subscribe", "/api/", "/auth/"],
      },
    ],
    sitemap: "https://dacha-ai.ru/sitemap.xml",
  };
}
