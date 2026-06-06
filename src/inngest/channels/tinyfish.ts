import { channel, topic } from "@inngest/realtime";

export const TINYFISH_CHANNEL_NAME = "tinyfish-execution";

export const tinyFishChannel = channel(TINYFISH_CHANNEL_NAME)
  .addTopic(
    topic("status").type<{
      nodeId: string;
      status: "loading" | "success" | "error";
    }>(),
  );
