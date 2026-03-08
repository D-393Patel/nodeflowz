import { NodeType } from "@/generated/prisma";
import { NodeExecutor } from "../types";
import { manualTriggerExecutor } from "@/features/triggers/components/manual_trigger.tsx/executor";
import { httpRequestDataExecutor } from "../components/http-request/executor";

export const executorRegistry:Record<NodeType,NodeExecutor>={
    [NodeType.MANUAL_TRIGGER]:manualTriggerExecutor,
    [NodeType.INITIAL]:manualTriggerExecutor,
    [NodeType.HTTP_REQUEST]:httpRequestDataExecutor
}

export const getExecutor=(type:NodeType):NodeExecutor=>{
    const executor=executorRegistry[type];
    if(!executor){
        throw new Error(`No executor found for node type:${type}`);
    }
    return executor;
}