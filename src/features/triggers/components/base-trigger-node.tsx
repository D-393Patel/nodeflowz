"use client"
 import { type NodeProps,Position } from "@xyflow/react"
 import type { LucideIcon } from "lucide-react"
 import Image from "next/image"
 import {memo,type ReactNode} from "react"
 import {BaseNode,BaseNodeContent} from "@/components/react-flow/base-node"
import {BaseHandle} from "@/components/react-flow/base-handle"
import { WorkflowNode } from "@/components/workflow-node"
import { onSet } from "better-auth/client"

interface BaseTriggerNodeProps extends NodeProps {
    icon:LucideIcon | string;
    name:string;
    description?:string;
    children?:ReactNode

    onSettings?:()=>void;
    onDoubleClick?:()=>void;
}

export const BaseTriggerNode=memo(
    ({
    id,
    icon:Icon,
    name,
    description,
    children,
    onSettings,
    onDoubleClick
    }:BaseTriggerNodeProps)=>{
        //TODO: add delete methods
    const handleDelete=()=>{}
        return(
        <WorkflowNode
        name={name}
        description={description}
        onDelete={handleDelete}
        onSettings={onSettings}
        >
        {/* to wrap within NodeStatusIndicator */}
        <BaseNode onDoubleClick={onDoubleClick} className="rounded-l-2xl relative group">
        <BaseNodeContent>
        {typeof Icon=== "string"?(
            <Image src={Icon} alt={name} width={16} height={16}/>
        ): (
            <Icon className="size-4 text-muted-foreground"/>
        )}
        {children}
        {/* <BaseHandle 
        id="target-1"
        type="target"
        position={Position.Left}
        /> */}
        <BaseHandle 
        id="source-1"
        type="source"
        position={Position.Right}
        />
        </BaseNodeContent>
        </BaseNode>
        </WorkflowNode>
        )
    }
);
BaseTriggerNode.displayName="BaseTriggerNode";