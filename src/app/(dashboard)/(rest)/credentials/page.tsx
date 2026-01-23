import { requireAuth } from "@/lib/auth-utils";

const Page=async()=>{
    await requireAuth();
    return (
        <p>Crdentials</p>
    );
}
export default Page;