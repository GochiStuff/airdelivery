"use client";
import { useFileTransfer } from "@/hooks/useFileTransfer";
import { useWebRTC } from "@/hooks/useWebRTC";
import { createContext, useContext, useRef, useState, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type WebRTCContextType = ReturnType<typeof useWebRTC> &
  ReturnType<typeof useFileTransfer> & {
    connectToFlight: (id: string) => void;
    leaveFlight: () => void;
    flightId: string;
  };

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const WebRTCProvider = ({ children }: Props) => {
  const [flightId, setFlightId] = useState<string>("");

  //  Temporary ref holder
  const fileTransRef = useRef<ReturnType<typeof useFileTransfer> | null>(null);

  // webRTC with callback that checks ref
  const webRTC = useWebRTC((e) => {
    fileTransRef.current?.handleMessage(e);
  });

  //Create fileTrans and assign to ref
  const fileTrans = useFileTransfer(webRTC.dataChannel, webRTC.disconnect , webRTC.updateStats);
  fileTransRef.current = fileTrans;

  const connectToFlight = (id: string) => {
    setFlightId(id);
    webRTC.connectToFlight(id);
  };

  const leaveFlight = () => {
    fileTrans.setMeta({
      totalSent: 0,
      totalReceived: 0,
      speedBps: 0,
    });
    fileTrans.setQueue([]);
    fileTrans.setRecvQueue([]);

    webRTC.disconnect();
    setFlightId("");
  };

  return (
    <WebRTCContext.Provider
      value={{
        ...webRTC,
        ...fileTrans,
        connectToFlight,
        leaveFlight,
        flightId,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTCContext = () => {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error("WebRTCContext not found");
  return ctx;
};
