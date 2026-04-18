import Image from "next/image";
import { proxifyGuideMediaUrl } from "@/lib/guide-image-url";

type Props = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
};

/** next/image не принимает data: URL — используем обычный img. */
export function CropImage({ src, alt, className, fill, width, height, sizes }: Props) {
  if (src.startsWith("data:")) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className={className ?? "object-cover w-full h-full"} />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} width={width} height={height} className={className} />
    );
  }

  const displaySrc = proxifyGuideMediaUrl(src);

  if (displaySrc.startsWith("/api/guide-image")) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- прокси Wikimedia, тот же origin
        <img
          src={displaySrc}
          alt={alt}
          className={className ?? "object-cover absolute inset-0 w-full h-full"}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={displaySrc} alt={alt} width={width} height={height} className={className} />
    );
  }

  return (
    <Image
      src={displaySrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      unoptimized
    />
  );
}
