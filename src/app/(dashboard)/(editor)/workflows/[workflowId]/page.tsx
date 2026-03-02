import { Editor, EditorError, EditorLoading } from "@/features/editor/components/editor";
import { EditorHeader } from "@/features/editor/components/editor-header";
import { WorkflowsError, WorkflowsLoading } from "@/features/workflows/components/workflows";
import { prefetchWorkflow } from "@/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface PageProps {
    params:Promise<{
     workflowId:string;
    }>
}

//go to https://localhost:3000/workflows/123
const Page=async({params}: PageProps)=>{
    await requireAuth();
    const {workflowId}=await params;
    prefetchWorkflow(workflowId);//prefetch do not need to be awaited just populating the cache 
    return (
                <HydrateClient>
                            <ErrorBoundary fallback={<EditorError/>}>
                                <Suspense fallback={<EditorLoading/>}>
                                <EditorHeader workflowId={workflowId}/>
                                <main className="flext-1">
                                <Editor workflowId={workflowId}/>
                                </main>
                                
                                </Suspense>

                            </ErrorBoundary>

                </HydrateClient>
    );
}
export default Page;