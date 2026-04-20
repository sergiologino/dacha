import { toast } from "sonner";
import { shouldQueueOfflineMutation } from "@/lib/offline/should-queue-offline";

export function toastFeatureNeedsInternet(featureLabel: string) {
  toast.message(`${featureLabel} недоступно без интернета`, {
    description: "Подключитесь к сети и попробуйте снова.",
  });
}

/** false — уже показали тост, вызывающий код должен прервать действие. */
export function guardOnlineForFeature(featureLabel: string): boolean {
  if (shouldQueueOfflineMutation()) {
    toastFeatureNeedsInternet(featureLabel);
    return false;
  }
  return true;
}
