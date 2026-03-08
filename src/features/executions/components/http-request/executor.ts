import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import ky,{type Options as KyOptions} from "ky";

type HttpRequestData={
variableName?:string;
endpoint?:string,
 method?:"GET"|"POST"|"PUT"|"PATCH"|"DELETE"
body?:string,
}
export const httpRequestDataExecutor:NodeExecutor<HttpRequestData>=async({
data,
nodeId,
context,
step,
})=>{
//publish "loading" state for http request
if(!data.endpoint){
//publish "error" state for http request
throw new NonRetriableError("HTTP Request node: No endpoint configured")
}
if(!data.variableName){
//publish "error" state for http request
throw new NonRetriableError("VariableName not configured")
}
const result=await step.run("http-request",async()=>{
    const endpoint=data.endpoint!;
    const method=data.method ||"GET";
    
    const options:KyOptions={method};
    if(["POST","PUT","PATCH"].includes(method))
    {
    options.body=data.body;
    options.headers={
        "Content-Type":"application/json",
    };
    }
    const response=await ky(endpoint,options);
    const contentTYpe=response.headers.get("content-type")
    const responseData=contentTYpe?.includes("application/json")
    ?await response.json()
    :await response.text();
    const responsePayload={
       httpResponse:{
            status:response.status,
            statusText:response.statusText,
            data:responseData
        } 
    }
    if(data.variableName){
    return {
        ...context,
        [data.variableName]:responsePayload,
    }
    
}
//fallback to direct httpResponse for backwards Compatibility
    return{
        ...context,
        ...responsePayload,
    }
})
// const result=await step.run("http-request",async ()=>context);

//publish "success" state for http request

return result;
}