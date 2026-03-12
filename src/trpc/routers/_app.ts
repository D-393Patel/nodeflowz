

import { credentialsRouter } from '@/features/credentials/server/routers';
import {createTRPCRouter } from '../init';
import { workflowRouter } from '@/features/workflows/server/routers'

export const appRouter = createTRPCRouter({
credentials: credentialsRouter,
workflows:workflowRouter,

});
// export type definition of API
export type AppRouter = typeof appRouter;




























//import { inngest } from '@/inngest/client';
//import prisma from '@/lib/db';
// import { google } from '@ai-sdk/google';
// import { generateText } from 'ai';
// import { TRPCError } from '@trpc/server';
//all the tests we made in appRouter 
  // getUsers: protectedProcedure.query(({ctx})=>{
//   //   // console.log({userId:ctx.auth.user.id})
//   // return prisma.user.findMany({
//   //   where:{
//   //     id:ctx.auth.user.id,
//   //   },
//   // });
// // }),
//   testAi:premiumProcedure.mutation(async()=>{
//   //   const { text } = await generateText({
//   // model: google('gemini-2.5-flash'),
//   // prompt: 'Write a vegetarian lasagna recipe for 4 people.',
//   // });
//   // return text;
//   // throw new TRPCError({code:"BAD_REQUEST", message:"Something went wrong"})
//   // logger.info(...)
//   await inngest.send({
//     name:"execute/ai",
//   })
//   return {success:true,message:"Job queued"}
//   }),
//   getWorkflows:protectedProcedure.query(({ctx})=>{
//     return prisma.workflow.findMany();
//   }),
//   createWorkflow:protectedProcedure.mutation(async()=>{
//     await inngest.send({
//       name:"test/hello.world",
//       data:{
//         email:"qwerty123@gmail.com",
//       },
//     });





//     return {success:true,message:"Job queued"}
//   }),