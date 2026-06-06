"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { tinyFishChannel } from "@/inngest/channels/tinyfish";
import { inngest } from "@/inngest/client";

export type TinyFishToken = Realtime.Token<
  typeof tinyFishChannel,
  ["status"]
>;

export async function fetchTinyFishRealtimeToken(): Promise<TinyFishToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: tinyFishChannel(),
    topics: ["status"],
  });

  return token;
}
