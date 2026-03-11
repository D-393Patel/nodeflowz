import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import ky,{type Options as KyOptions} from "ky";
import Handlebars from "handlebars";
import { Handle } from "vaul";


Handlebars.registerHelper("json",(context)=>{
const stringifed=JSON.stringify(context,null,2);
const safestring= new Handlebars.SafeString(stringifed);
return  safestring;
});

type HttpRequestData={
variableName:string;
endpoint:string;
method:"GET"|"POST"|"PUT"|"PATCH"|"DELETE";
body?:string;
}
export const httpRequestExecutor:NodeExecutor<HttpRequestData>=async({
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
throw new NonRetriableError("HTTP Request node:VariableName not configured")
}
if(!data.method){
//publish "error" state for http request
throw new NonRetriableError("HTTP Request node:Method not configured")
}
const result=await step.run("http-request",async()=>{
    //http://..../{{todo.httpResponse.data.userId}} context is previous node data
    const endpoint=Handlebars.compile(data.endpoint)(context);
    // console.log("ENDPOINT",{endpoint})
    const method=data.method;
    
    const options:KyOptions={method};
    if(["POST","PUT","PATCH"].includes(method))
    {
    const resolved=Handlebars.compile(data.body ||"{}")(context);
    console.log("BODY: ",resolved)
    JSON.parse(resolved);
    options.body=resolved;
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
    return {
        ...context,
        [data.variableName]:responsePayload,
    
    }

})
// const result=await step.run("http-request",async ()=>context);

//publish "success" state for http request

return result;
}