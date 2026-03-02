import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch ,trpc } from "@/trpc/server"; // adjust path if needed
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

type Input = inferInput<typeof trpc.workflows.getMany>;

/**
 * Prefetch all workflows
 */
export const prefetchWorkflows = (params: Input) => {
  return prefetch(trpc.workflows.getMany.queryOptions(params));
};

/**
 * Prefetch a single workflow
 */
export const prefetchWorkflow=(id:string)=>{
return prefetch(trpc.workflows.getOne.queryOptions({id}))
};

export const useSuspenseWorkflow=(id:string)=>{
  const trpc=useTRPC();
  return useSuspenseQuery(trpc.workflows.getOne.queryOptions({
    id
  }));
}