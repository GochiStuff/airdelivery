"use client"

import { WebRTCProvider } from "@/context/WebRTCContext"
import React from "react"

export default function Providers({children } : { children : React.ReactNode}){
    return <WebRTCProvider>{children}</WebRTCProvider>;
}