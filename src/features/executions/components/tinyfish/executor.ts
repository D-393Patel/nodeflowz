import Handlebars from "handlebars";
import ky from "ky";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { tinyFishChannel } from "@/inngest/channels/tinyfish";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  return new Handlebars.SafeString(jsonString);
});

type TinyFishData = {
  variableName?: string;
  credentialId?: string;
  url?: string;
  goal?: string;
};

export const tinyFishExecutor: NodeExecutor<TinyFishData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(
    tinyFishChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName) {
    await publish(
      tinyFishChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("TinyFish node: Variable name is missing");
  }

  if (!data.credentialId) {
    await publish(
      tinyFishChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("TinyFish node: Credential is required");
  }

  if (!data.url) {
    await publish(
      tinyFishChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("TinyFish node: URL is required");
  }

  if (!data.goal) {
    await publish(
      tinyFishChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("TinyFish node: Goal is required");
  }

  const credential = await step.run("get-tinyfish-credential", () => {
    return prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        userId,
      },
    });
  });

  if (!credential) {
    await publish(
      tinyFishChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("TinyFish node: Credential not found");
  }

  const resolvedUrl = Handlebars.compile(data.url)(context);
  const resolvedGoal = Handlebars.compile(data.goal)(context);

  try {
    const result = await step.run("tinyfish-run-sync", async () => {
      return ky
        .post("https://agent.tinyfish.ai/v1/automation/run", {
          headers: {
            "X-API-Key": decrypt(credential.value),
            "Content-Type": "application/json",
          },
          json: {
            url: resolvedUrl,
            goal: resolvedGoal,
          },
          timeout: 90_000,
        })
        .json<unknown>();
    });

    await publish(
      tinyFishChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return {
      ...context,
      [data.variableName]: {
        result,
      },
    };
  } catch (error) {
    await publish(
      tinyFishChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
