import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params:Promise<{
     credentialId:string;
    }>
}

//go to https://localhost:3000/credentials/123
const Page=async({params}: PageProps)=>{
    await requireAuth();
    const {credentialId}=await params;
    return (
        <p>Crdential  id: {credentialId}</p>
    );
}
export default Page;