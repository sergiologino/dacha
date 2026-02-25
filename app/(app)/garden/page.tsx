import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import GardenContent from "./garden-content";

function GardenFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  );
}

export default function GardenPage() {
  return (
    <Suspense fallback={<GardenFallback />}>
      <GardenContent />
    </Suspense>
  );
}
