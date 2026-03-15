import { getAuthUser } from "@/lib/get-user";
import {
  buildYearlyPromoOffer,
  getInactiveYearlyPromoOffer,
} from "@/lib/yearly-promo";
import { SubscribeContent } from "./subscribe-content";

export default async function SubscribePage() {
  const user = await getAuthUser().catch(() => null);
  const initialOffer = user
    ? buildYearlyPromoOffer(user)
    : getInactiveYearlyPromoOffer();

  return <SubscribeContent initialOffer={initialOffer} />;
}
