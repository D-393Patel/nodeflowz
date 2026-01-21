import prisma from "@/lib/db";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    //fetching the youtube video
    await step.sleep("wait-a-moment", "5s");//sleeps for 1 s
    //transcribing the video
    await step.sleep("wait-a-moment", "5s");
    //sending transcription to API
    await step.sleep("wait-a-moment", "5s");
    // return { message: `Hello ${event.data.email}!` };
    await step.run("create-workflow",()=>{
        return prisma.workflow.create({
            data:{
                name:"workflow-from-inngest",
            },
        })
    })
  },
);