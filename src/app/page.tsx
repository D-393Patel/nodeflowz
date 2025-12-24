// routing page in next js application
//it is much easier to work with cn than to template literal
// import {cn} from '@/lib/utils'
import {Button} from "@/components/ui/button"
// import { useEffect } from "react";
import prisma from "@/lib/db";
const Page =async()=>{
  // const something=true;
  // useEffect(()=>{},[]);
  const users=await prisma.user.findMany();
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      {JSON.stringify(users)}
    </div>
  );
};
export default Page;