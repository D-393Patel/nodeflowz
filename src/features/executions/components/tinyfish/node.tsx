"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { TinyFishDialog, TinyFishFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchTinyFishRealtimeToken } from "./actions";
import { TINYFISH_CHANNEL_NAME } from "@/inngest/channels/tinyfish";

type TinyFishNodeData = {
  variableName?: string;
  credentialId?: string;
  url?: string;
  goal?: string;
};

type TinyFishNodeType = Node<TinyFishNodeData>;

export const TinyFishNode = memo((props: NodeProps<TinyFishNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: TINYFISH_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchTinyFishRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: TinyFishFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...values,
            },
          };
        }

        return node;
      }),
    );
  };

  const nodeData = props.data;
  const description = nodeData?.url
    ? `Run on ${nodeData.url}`
    : "Not configured";

  return (
    <>
      <TinyFishDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/tinyfish.svg"
        name="TinyFish"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

TinyFishNode.displayName = "TinyFishNode";
