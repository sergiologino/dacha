"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function useOnboardingCheck() {
  const { status } = useSession();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/user/location")
      .then((res) => res.json())
      .then((data) => {
        if (!data.onboardingDone) {
          router.replace("/onboarding");
        } else {
          setChecked(true);
        }
      })
      .catch(() => setChecked(true));
  }, [status, router]);

  return checked;
}
