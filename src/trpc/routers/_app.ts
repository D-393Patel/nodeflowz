
import { baseProcedure, createTRPCRouter } from '../init';
import prisma from '@/lib/db';
export const appRouter = createTRPCRouter({
  getUsers: baseProcedure.query(()=>{
  return prisma.user.findMany();
}),
    // .query(opts)(
    //   z.object({
    //     text: z.string(),
    //   }),
    // )

});
// export type definition of API
export type AppRouter = typeof appRouter;