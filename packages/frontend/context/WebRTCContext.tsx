"use client";
import { useFileTransfer } from "@/hooks/useFileTransfer";
import { useWebRTC } from "@/hooks/useWebRTC";
import { createContext, useContext, useRef, useState, ReactNode, useMemo } from "react";

type Props = {
  children: ReactNode;
};

// Split into State and Actions
type WebRTCState = {
  flightId: string;
  queue: ReturnType<typeof useFileTransfer>["queue"];
  recvQueue: ReturnType<typeof useFileTransfer>["recvQueue"];
  meta: ReturnType<typeof useFileTransfer>["meta"];
  autoDownload: ReturnType<typeof useFileTransfer>["autoDownload"];
  status: ReturnType<typeof useWebRTC>["status"];
  members: ReturnType<typeof useWebRTC>["members"];
  nearByUsers: ReturnType<typeof useWebRTC>["nearByUsers"];
  isConnecting?: boolean; 
  dataChannel: ReturnType<typeof useWebRTC>["dataChannel"];
};

type WebRTCActions = {
  connectToFlight: (id: string) => void;
  leaveFlight: () => void;
  refreshNearby: ReturnType<typeof useWebRTC>["refreshNearby"];
  inviteToFlight: ReturnType<typeof useWebRTC>["inviteToFlight"];
  handleFileSelect: ReturnType<typeof useFileTransfer>["handleFileSelect"];
  cancelTransfer: ReturnType<typeof useFileTransfer>["cancelTransfer"];
  pauseTransfer: ReturnType<typeof useFileTransfer>["pauseTransfer"];
  resumeTransfer: ReturnType<typeof useFileTransfer>["resumeTransfer"];
  downloadFile: ReturnType<typeof useFileTransfer>["downloadFile"];
  downloadAll: ReturnType<typeof useFileTransfer>["downloadAll"];
  setAutoDownload: ReturnType<typeof useFileTransfer>["setAutoDownload"];
  resetTransfer: ReturnType<typeof useFileTransfer>["resetTransfer"];
  openFile: ReturnType<typeof useFileTransfer>["openFile"];
  cancelReceive: ReturnType<typeof useFileTransfer>["cancelReceive"];
};

const WebRTCStateContext = createContext<WebRTCState | null>(null);
const WebRTCActionsContext = createContext<WebRTCActions | null>(null);

export const WebRTCProvider = ({ children }: Props) => {
  const [flightId, setFlightId] = useState<string>("");
  const fileTransRef = useRef<ReturnType<typeof useFileTransfer> | null>(null);

  const webRTC = useWebRTC((e) => {
    fileTransRef.current?.handleMessage(e);
  });

  const fileTrans = useFileTransfer(webRTC.dataChannel, webRTC.disconnect, webRTC.updateStats);
  fileTransRef.current = fileTrans;

  const actions = useMemo(() => ({
    connectToFlight: (id: string) => {
      setFlightId(id);
      webRTC.connectToFlight(id);
    },
    leaveFlight: () => {
      fileTrans.setMeta({ totalSent: 0, totalReceived: 0, speedBps: 0 });
      fileTrans.setQueue([]);
      fileTrans.setRecvQueue([]);
      webRTC.disconnect();
      setFlightId("");
    },
    refreshNearby: webRTC.refreshNearby,
    inviteToFlight: webRTC.inviteToFlight,
    handleFileSelect: fileTrans.handleFileSelect,
    cancelTransfer: fileTrans.cancelTransfer,
    pauseTransfer: fileTrans.pauseTransfer,
    resumeTransfer: fileTrans.resumeTransfer,
    downloadFile: fileTrans.downloadFile,
    downloadAll: fileTrans.downloadAll,
    setAutoDownload: fileTrans.setAutoDownload,
    resetTransfer: fileTrans.resetTransfer,
    openFile: fileTrans.openFile,
    cancelReceive: fileTrans.cancelReceive,
  }), [
    webRTC.connectToFlight, 
    webRTC.disconnect, 
    webRTC.refreshNearby, 
    webRTC.inviteToFlight, 
    fileTrans.handleFileSelect, 
    fileTrans.cancelTransfer, 
    fileTrans.pauseTransfer, 
    fileTrans.resumeTransfer,
    fileTrans.downloadFile,
    fileTrans.downloadAll,
    fileTrans.setAutoDownload,
    fileTrans.resetTransfer,
    fileTrans.openFile,
    fileTrans.cancelReceive
  ]);

  const state = {
    flightId,
    queue: fileTrans.queue,
    recvQueue: fileTrans.recvQueue,
    meta: fileTrans.meta,
    autoDownload: fileTrans.autoDownload,
    status: webRTC.status,
    members: webRTC.members,
    nearByUsers: webRTC.nearByUsers,
    dataChannel: webRTC.dataChannel,
  };

  return (
    <WebRTCStateContext.Provider value={state}>
      <WebRTCActionsContext.Provider value={actions}>
        {children}
      </WebRTCActionsContext.Provider>
    </WebRTCStateContext.Provider>
  );
};

export const useWebRTCState = () => {
  const ctx = useContext(WebRTCStateContext);
  if (!ctx) throw new Error("WebRTCStateContext not found");
  return ctx;
};

export const useWebRTCActions = () => {
  const ctx = useContext(WebRTCActionsContext);
  if (!ctx) throw new Error("WebRTCActionsContext not found");
  return ctx;
};
