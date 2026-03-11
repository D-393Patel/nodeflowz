"use server"
import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { httpRequestChannel } from "@/inngest/channels/http-request";
import { inngest } from "@/inngest/client";

export type HttpRequestToken=Realtime.Token<
typeof httpRequestChannel,
["status"]
>;

// Remove the semicolon and place the type before the curly brace
export async function fetchHttpRequestRealTimeToken(): Promise<HttpRequestToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: httpRequestChannel(),
        topics: ["status"],
    });
    
    return token;
}

