export type GalleryUserSummary = {
  name: string | null;
  image: string | null;
};

export type GalleryComment = {
  id: string;
  content: string;
  createdAt: string;
  user: GalleryUserSummary;
};

export type GalleryPhoto = {
  id: string;
  url: string;
  caption: string | null;
  publishedAt: string | null;
  takenAt: string;
  analysisResult: string | null;
  analysisStatus: string | null;
  plantName: string | null;
  cropSlug: string | null;
  bedName: string | null;
  bedType: string | null;
  user: GalleryUserSummary;
  likesCount: number;
  commentsCount: number;
  likedByViewer: boolean;
  comments?: GalleryComment[];
};

export function getPublicAppUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://dacha-ai.ru"
  );
}

export function getGalleryPhotoUrl(photoId: string): string {
  return `${getPublicAppUrl()}/gallery/${photoId}`;
}
