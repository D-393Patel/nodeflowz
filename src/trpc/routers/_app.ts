
import { inngest } from '@/inngest/client';
import {baseProcedure, createTRPCRouter, protectedProcedure } from '../init';
import prisma from '@/lib/db';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { TRPCError } from '@trpc/server';
export const appRouter = createTRPCRouter({
  // getUsers: protectedProcedure.query(({ctx})=>{
  //   // console.log({userId:ctx.auth.user.id})
  // return prisma.user.findMany({
  //   where:{
  //     id:ctx.auth.user.id,
  //   },
  // });
// }),
  testAi:baseProcedure.mutation(async()=>{
  //   const { text } = await generateText({
  // model: google('gemini-2.5-flash'),
  // prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  // });
  // return text;
  // throw new TRPCError({code:"BAD_REQUEST", message:"Something went wrong"})
  // logger.info(...)
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