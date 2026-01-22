"use client"
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { requireAuth } from "@/lib/auth-utils";
import {caller} from "@/trpc/server"
import { LogoutButton } from "./logout";
import { mutationOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";


const Page=()=>{
  // const { data } = authClient.useSession() 
  // await requireAuth(); //data access Layer(security layer don't see errors and broken pages)
  // const data=await caller.getUsers();
  const trpc=useTRPC();
  const queryClient=useQueryClient();
  const {data}=useQuery(trpc.getWorkflows.queryOptions());
  const testAi=useMutation(trpc.testAi.mutationOptions({
    onSuccess:()=>{
      toast.success("AI Job queued")
    }
  }));
  const create=useMutation(trpc.createWorkflow.mutationOptions({
    onSuccess:()=>{
      // queryClient.invalidateQueries(trpc.getWorkflows.queryOptions())
      toast.success("Job queued")
    }
  }));
  
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center flex-col gap-y-6">
     {/* {JSON.stringify(data)}
     {data && (
     <Button  onClick={()=> authClient.signOut()}>
      LogOut
     </Button>
     )} */}
     protected server component
     <div>
      {JSON.stringify(data,null,2)}
     </div>
     <Button disabled={testAi.isPending} onClick={()=>testAi.mutate()}>
      Test Ai
     </Button>
     <Button disabled={create.isPending} onClick={()=>create.mutate()}>
      Create Workflow
     </Button>
     <LogoutButton/>
    </div>
  );
};

export default Page;















// routing page in next js application
//it is much easier to work with cn than to template literal
// import {cn} from '@/lib/utils'
// import {Button} from "@/components/ui/button"
// import { useEffect } from "react";
// import prisma from "@/lib/db";
// "use client"
// import { useTRPC } from "@/trpc/client";
// import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
// import {getQueryClient,trpc} from '@/trpc/server'
// import {Client} from "./api/client";
// import { Suspense } from "react";
// import {caller}from '@/trpc/server'
// const Page =async ()=>{
  // const some<thing=true;
  // useEffect(()=>{},[]);
  // const users=await prisma.user.findMany();
  // const users=await caller.getUsers();
  // const trpc=useTRPC();
  // const {data:users}=useQuery(trpc.getUsers.queryOptions());
//   const queryClient=getQueryClient();
//   await queryClient.prefetchQuery(trpc.getUsers.queryOptions());
//   return (
//     <div className="min-h-screen min-w-screen flex items-center justify-center">
//        /* <HydrationBoundary state={dehydrate(queryClient)}>
//         <Suspense fallback={<p>loading....</p>}> */
//         <Client />
//         </Suspense>
//        </HydrationBoundary>
       
//     </div>
//   );
// };
// export default Page;