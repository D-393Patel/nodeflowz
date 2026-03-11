"use server"
import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";

export type manualTriggerToken=Realtime.Token<
typeof manualTriggerChannel,
["status"]
>;

// Remove the semicolon and place the type before the curly brace
export async function fetchManualTriggerRealTimeToken(): Promise<manualTriggerToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: manualTriggerChannel(),
        topics: ["status"],
    });
    
    return token;
}



