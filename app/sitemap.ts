import { MetadataRoute } from "next";
import { crops } from "@/lib/data/crops";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dacha-ai.ru";

  const cropPages = crops.map((crop) => ({
    url: `${baseUrl}/guide/${crop.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  let galleryPosts: Array<{
    id: string;
    publishedAt: Date | null;
    createdAt: Date;
  }> = [];

  try {
    galleryPosts = await prisma.photo.findMany({
      where: {
        isPublic: true,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 500,
    });
  } catch {
    galleryPosts = [];
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guide/lifehacks`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/facts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/kogda-sazhat-rassadu`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/kalendar-posadok-2026`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/kogda-sazhat-rassadu/vse-sovety`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/kalendar-posadok-2026/vse-sovety`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/spravochnik-udobreniy-i-zashchity`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.88,
    },
    ...galleryPosts.map((photo) => ({
      url: `${baseUrl}/gallery/${photo.id}`,
      lastModified: photo.publishedAt ?? photo.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
    ...cropPages,
  ];
}
