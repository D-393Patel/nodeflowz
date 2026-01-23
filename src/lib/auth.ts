import { betterAuth, check } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/db"
import { checkout, portal, polar } from "@polar-sh/better-auth";
import { polarClient } from "./polar";
export const auth = betterAuth({
database:prismaAdapter(prisma,{
    provider:"postgresql",
}),
emailAndPassword:{
    enabled:true,
    autoSignIn:true, //this would automatically sign in when someone registers
},
plugins:[
    polar({
        client:polarClient,
        createCustomerOnSignUp:true,
        use:[
            checkout({
                products:[
                    {
                        productId:"f3c6b1f5-ef4e-403d-9dae-63e813662787",
                        slug:"pro"
                    }
                ],
                successUrl:process.env.POLAR_SUCCESS_URL,
                authenticatedUsersOnly:true,
            }),
            portal(),
        ]
    })
]
});