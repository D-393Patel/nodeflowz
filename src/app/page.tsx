// routing page in next js application
//it is much easier to work with cn than to template literal
// import {cn} from '@/lib/utils'
// import {Button} from "@/components/ui/button"
// import { useEffect } from "react";
// import prisma from "@/lib/db";
// "use client"
import { useTRPC } from "@/trpc/client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {getQueryClient,trpc} from '@/trpc/server'
import {Client} from "./api/client";
import { Suspense } from "react";
// import {caller}from '@/trpc/server'
const Page =async ()=>{
  // const some<thing=true;
  // useEffect(()=>{},[]);
  // const users=await prisma.user.findMany();
  // const users=await caller.getUsers();
  // const trpc=useTRPC();
  // const {data:users}=useQuery(trpc.getUsers.queryOptions());
  const queryClient=getQueryClient();
  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
       <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<p>loading.....</p>}>
        <Client />
        </Suspense>
       </HydrationBoundary>
      
    </div>
  );
};
export default Page;