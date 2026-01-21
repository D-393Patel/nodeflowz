
import { inngest } from '@/inngest/client';
import {createTRPCRouter, protectedProcedure } from '../init';
import prisma from '@/lib/db';
export const appRouter = createTRPCRouter({
  // getUsers: protectedProcedure.query(({ctx})=>{
  //   // console.log({userId:ctx.auth.user.id})
  // return prisma.user.findMany({
  //   where:{
  //     id:ctx.auth.user.id,
  //   },
  // });
// }),
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