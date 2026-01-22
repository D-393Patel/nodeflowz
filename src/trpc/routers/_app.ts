
import { inngest } from '@/inngest/client';
import {createTRPCRouter, protectedProcedure } from '../init';
import prisma from '@/lib/db';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
export const appRouter = createTRPCRouter({
  // getUsers: protectedProcedure.query(({ctx})=>{
  //   // console.log({userId:ctx.auth.user.id})
  // return prisma.user.findMany({
  //   where:{
  //     id:ctx.auth.user.id,
  //   },
  // });
// }),
  testAi:protectedProcedure.mutation(async()=>{
  //   const { text } = await generateText({
  // model: google('gemini-2.5-flash'),
  // prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  // });
  // return text;

  await inngest.send({
    name:"execute/ai",
  })
  return {success:true,message:"Job queued"}
  }),
  getWorkflows:protectedProcedure.query(({ctx})=>{
    return prisma.workflow.findMany();
  }),
  createWorkflow:protectedProcedure.mutation(async()=>{
    await inngest.send({
      name:"test/hello.world",
      data:{
        email:"qwerty123@gmail.com",
      },
    });





    return {success:true,message:"Job queued"}
  }),

});
// export type definition of API
export type AppRouter = typeof appRouter;