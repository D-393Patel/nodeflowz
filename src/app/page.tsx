// routing page in next js application
//it is much easier to work with cn than to template literal
// import {cn} from '@/lib/utils'
import {Button} from "@/components/ui/button"
const Page =()=>{
  // const something=true;
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center"><Button variant={"outline"}>
      Click me
      </Button></div>
  );
};
export default Page;