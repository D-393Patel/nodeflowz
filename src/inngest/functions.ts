// import prisma from "@/lib/db";
// import { inngest } from "./client";
// import { createGoogleGenerativeAI } from "@ai-sdk/google";
// import { generateText } from "ai";
// import {createOpenAI} from "@ai-sdk/openai"
// import {createAnthropic} from "@ai-sdk/anthropic"
// import * as Sentry from "@sentry/nextjs"
// const google=createGoogleGenerativeAI();
// const openai=createOpenAI();
// const authropic=createAnthropic();

// export const execute = inngest.createFunction(
//   { id: "execute-ai" },
//   { event: "execute/ai" },
//   async ({ event, step }) => {
//     await step.sleep("pretend","5s");
//     Sentry.logger.info('User triggered test log',{log_source:'sentry_test'})
//     console.warn("Something is missing");
//     console.error("This is an error i want to track");


    
//     const {steps: geminiSteps}=await step.ai.wrap("gemini-generate-text",
//         generateText,
//         {
//         model:google("gemini-2.5-flash"),
//         system:"You are a helpful assistant",
//         prompt:"What is 2+2;",
//         experimental_telemetry:{
//           isEnabled:true,
//           recordInputs:true,
//           recordOutputs:true,
//         }
//         }
//     );
//     const {steps: openaiSteps}=await step.ai.wrap("openai-generate-text",
//         generateText,
//         {
//         model:google("gpt-4"),
//         system:"You are a helpful assistant",
//         prompt:"What is 2+2;",
//         experimental_telemetry:{
//           isEnabled:true,
//           recordInputs:true,
//           recordOutputs:true,
//         }
//         }
//     );
//     const {steps: anthropicSteps}=await step.ai.wrap("anthropic-generate-text",
//         generateText,
//         {
//         model:google("claude-sonnet-4-5"),
//         system:"You are a helpful assistant",
//         prompt:"What is 2+2;",
//         experimental_telemetry:{
//           isEnabled:true,
//           recordInputs:true,
//           recordOutputs:true,
//         }
//         }
//     );
//     return {
//       geminiSteps,
//       openaiSteps,
//       anthropicSteps
//     };
//   },
// );































//
import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { NodeType } from "@/generated/prisma";

export const executeWorkflow=inngest.createFunction(
  {id:"execute-workflow"},
  {event:"workflows/execute.workflow"},
  async({event,step})=>{
  const workflowId=event.data.workflowId;
  if(!workflowId)
    throw new NonRetriableError("WorkflowId is missing")


  //  await step.sleep("test","5s");
  const sortedNodes=await step.run("prepare-workflow",async()=>{
    const workflow=await prisma.workflow.findUniqueOrThrow({
      where:{id:workflowId},
      include:{
        nodes:true,
        connections:true,
      },
    });
    return topologicalSort(workflow.nodes,workflow.connections);
  });
  //Initialize the context with any initial data from the trigger
  let context=event.data.initialData|| {};

  //Execute each node
  for (const node of sortedNodes){
    const executor=getExecutor(node.type as NodeType);
    context=await executor({
      data:node.data as Record<string,unknown>,
      nodeId:node.id,
      context,
      step,
    })
  }
  return {
    workflowId,
    result:context,
  };
  }
);