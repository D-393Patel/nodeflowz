"use client"

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Client=(  /*{users}:{users:Record<string,any>[]}  */)=>{
const trpc=useTRPC();
const {data:users}=useSuspenseQuery(trpc.getUsers.queryOptions());
return (
    <div>
        Client Component:{JSON.stringify(users)}
         {/* Client Component:[{"id":1,"email":"antonio12@gmail.com","name":null}]  */}
    </div>
  );
};
