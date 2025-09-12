import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/socketContext";
import { useRouter } from "next/navigation";

type Candidate = RTCIceCandidateInit;

function userMessage(msg: string) {
  // Map internal log messages to a more user-friendly status string, this is helpfull when Debugging  + user friendly at the same time .
  if (msg.includes("DataChannel opened")) return "Connection established";
  if (msg.includes("Connected")) return "Connection established";
  if (msg.includes("Offer sent")) return "Ready to connect";
  if (msg.includes("Answer sent")) return "Offer accepted...";
  if (msg.includes("Remote description set")) return "finalizing...";
  if (msg.includes("Added ICE candidate")) return "Connection improved";
  if (msg.includes("Buffered ICE candidate")) return "Connecting ...";
  if (msg.includes("Joined signaling")) return "Joined room, waiting";
  if (msg.includes("Failed to join")) return "Failed to join room";
  if (msg.includes("Invalid room code")) return "Invalid room code";
  if (msg.includes("Failed to add ICE candidate")) return "Connection Failed";
  return msg;
}

type Member = {
  id: string;
  name: string;
};

export function useWebRTC(onMessage: (e: MessageEvent) => void) {
  const [flightCode, setFlightCode] = useState<string | null>(null);
  const { socket } = useSocket();
  const peer = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const [status, setStatus] = useState("Connecting...");
  const [members, setMembers] = useState<Member[]>([]);
  const [ownerId, setOwnerId] = useState<string>("");
  const [nearByUsers, setNearByUsers] = useState<Member[]>([]);
  const queuedCandidates = useRef<RTCIceCandidateInit[]>([]);

  // HELPERS 
  function connectToFlight(code: string) {
    setFlightCode(code);
  }

  function log(msg: string) {
    const friendly = userMessage(msg);
    setStatus(friendly);
  }

  function sendFeedback(form: {
    email: string;
    type: string;
    subject: string;
    message: string;
  }) {
    socket?.emit("feedback", JSON.stringify({ form }));
  }

  // --- Peer connection creation -----------------------------------------
  function createPeer(id: string) {

    // Create the RTCPeerConnection with STUN servers ( TURN REMOVED ) +  might not work in corporate network
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    pc.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        if (candidate.includes("typ relay")) {
        } else if (
          candidate.includes("typ srflx") ||
          candidate.includes("typ host")
        ) {
        }
      }
    });

    // Connection state change handling
    if (pc) {
      pc.onconnectionstatechange = () => {
        const state = peer.current?.connectionState;
        // When disconnected/failed/closed -> clean up
        if (state === "disconnected" || state === "failed" || state === "closed") {
          log("Disconnected");
          disconnect();
        }
        // When connected -> update status
        if (state === "connected") {
          log("Connected");
        }
      };
    }

    // Emit ICE candidates to signaling server as they are discovered
    pc.onicecandidate = (e) => {
      if (e.candidate && socket?.id) {
        socket?.emit("ice-candidate", { id, candidate: e.candidate });
      }
    };

    return pc;
  }

  // Disconnect / cleanup
  function disconnect() {
    // Clean up peer connection
    if (peer.current) {
      peer.current.onicecandidate = null;
      peer.current.ondatachannel = null;
      peer.current.close();
      peer.current = null;
    }

    // Clean up data channel
    if (dataChannel.current) {
      dataChannel.current.onmessage = null;
      dataChannel.current.onopen = null;
      dataChannel.current.close();
      dataChannel.current = null;
    }

    // Reset UI state and buffers
    setFlightCode(null);
    setStatus("Disconnected");
    setOwnerId("");
    setMembers([]);
    queuedCandidates.current = [];

    socket?.emit("leaveFlight");
  }

  //  Sender
  async function initiateSender() {
    if (!peer.current) return;

    // Create the fileTransfer data channel and wire handlers
    dataChannel.current = peer.current.createDataChannel("fileTransfer");
    dataChannel.current.onopen = () => log("DataChannel opened.");
    dataChannel.current.onmessage = onMessage;

    // Create and set local offer
    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    log("Preparing offer...");
    // Emit offer immediately (do not wait for full ICE)
    socket?.emit("offer", flightCode, { sdp: peer.current.localDescription });
    log("Offer sent.");
  }

  //  refresh !! HELPER 
  async function refreshNearby() {
    socket?.emit("getNearbyUsers");
  }

  const updateStats = (files: number, transferred: number) => {
    socket?.emit("updateStats", {
      filesShared: files,
      Transferred: transferred,
    });
  };

  //  Receiver
  async function handleOffer(id: string, sdp: RTCSessionDescriptionInit) {
    // Create local peer instance for this incoming session
    peer.current = createPeer(id);

    // When remote creates a data channel, capture it and attach handlers
    peer.current.ondatachannel = (e) => {
      dataChannel.current = e.channel;
      e.channel.onmessage = onMessage;
      e.channel.onopen = () => log("DataChannel opened");
    };


    // Apply remote description, flush any buffered ICE candidates,
    // create answer and set local description
    await peer.current.setRemoteDescription(sdp);
    flushBufferedCandidates();
    const answer = await peer.current.createAnswer();
    await peer.current.setLocalDescription(answer);

    // Wait until ICE gathering completes before sending answer (original logic)
    await new Promise((resolve) => {
      if (peer.current?.iceGatheringState === "complete") {
        resolve(null);
      } else {
        const checkState = () => {
          if (peer.current?.iceGatheringState === "complete") {
            peer.current.removeEventListener("icegatheringstatechange", checkState);
            resolve(null);
          }
        };
        peer.current?.addEventListener("icegatheringstatechange", checkState);
      }
    });

    socket?.emit("answer", flightCode, { sdp: answer });
    log("Answer sent.");
  }

  // Sender: handle incoming answer
  async function handleAnswer(sdp: RTCSessionDescriptionInit) {
    if (peer.current) {
      try {
        await peer.current.setRemoteDescription(sdp);
        flushBufferedCandidates();

        // Add any queued candidates 
        queuedCandidates.current.splice(0).forEach((candidate) => {
          peer.current
            ?.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(log);
        });
        log("Remote description set.");
      } catch (e) {
        console.error("Failed to set remote description", e);
        log("Failed to set remote description");
      }
    }
  }

  // Handle incoming ICE candidate from remote 
  async function handleIce(id: string, candidate: Candidate) {
    try {
      if (peer.current?.remoteDescription) {
        // If remoteDescription exists, add candidate immediately
        await peer.current.addIceCandidate(new RTCIceCandidate(candidate));
        log("Added ICE candidate");
      } else {
        // Otherwise buffer for later
        queuedCandidates.current.push(candidate);
        log("Buffered ICE candidate");
      }
    } catch (err) {
      console.error("Failed to add ICE candidate", err);
    }
  }

  // Flush any buffered ICE candidates once remoteDescription is set 
  const flushBufferedCandidates = async () => {
    for (const c of queuedCandidates.current) {
      try {
        await peer.current?.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.error("Failed to add buffered ICE", e);
      }
    }
    queuedCandidates.current = [];
  };

  // Invite send .
  async function inviteToFlight(user: Member, currentFlightCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      socket?.emit(
        "inviteToFlight",
        {
          targetId: user.id,
          flightCode: currentFlightCode,
        },
        (res: { success: boolean; message?: string }) => {
          if (res.success) {
            resolve();
          } else {
            console.error("Invite failed:", res.message);
            reject(res.message);
          }
        }
      );
    });
  }

  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    socket.on("offer", async (id, { sdp }) => {
      if (!sdp) {
        log("Failed : missing payload");
        return;
      }
      await handleOffer(id, sdp.sdp);
    });

    socket.on("answer", async ({ sdp }) => {
      await handleAnswer(sdp);
    });

    socket.on("ice-candidate", async ({ candidate, id }) => {
      await handleIce(id, candidate);
    });

    socket.on("nearbyUsers", (users: Member[]) => {
      setNearByUsers(users);
    });

    if (!flightCode) {
      log("Invalid room code.");
      return () => {
        socket.off("nearbyUsers");
        socket.off("offer");
        socket.off("answer");
        socket.off("ice-candidate");
      };
    }

    socket.emit("joinFlight", flightCode, (resp: { success: boolean; message?: string }) => {
      if (resp.success) {
        log("Joined signaling.");
      } else {
        if (resp.message === "Flight is full") {
          router.push("/flightFull");
        } else {
          log(`Failed to join: ${resp.message}`);
        }
      }
    });

    socket.on("flightUsers", ({ ownerId: oid, members: m }) => {
      setOwnerId(oid);
      setMembers(m);

      if (socket?.id === oid && !peer.current) {
        peer.current = createPeer(oid);
        initiateSender();
      }

      socket.emit("getNearbyUsers");
    })

    return () => {
      socket.off("flightUsers");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("nearbyUsers");

      if (peer.current) {
        peer.current.close();
        peer.current = null;
      }
    };
  }, [socket, flightCode]);

  return {
    dataChannel: dataChannel.current,
    status,
    nearByUsers,
    inviteToFlight,
    updateStats,
    sendFeedback,
    connectToFlight,
    refreshNearby,
    disconnect,
    members,
  };
}
