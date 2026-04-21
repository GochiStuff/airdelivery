import React, { useEffect, useState } from "react";
import { useSocket } from "../context/socketContext";
import { useRouter } from "next/navigation";

type Invitation = {
  flightCode: string;
  fromId: string;
  fromName: string;
};

export function useInvitationToJoin() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [timer, setTimer] = useState(60); // seconds
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleInvitedToFlight = ({
      flightCode,
      fromId,
      fromName,
    }: Invitation) => {
      setInvitation({ flightCode, fromId, fromName });
      setTimer(60);
    };

    socket.on("invitedToFlight", handleInvitedToFlight);
    return () => {
      socket.off("invitedToFlight", handleInvitedToFlight);
    };
  }, [socket]);

  useEffect(() => {
    if (!invitation) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setInvitation(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [invitation , socket]);

    const router = useRouter();

    const accept = () => {
    if (invitation) {
        router.push(`/flight/${invitation.flightCode}`); 
        setInvitation(null);
    }
    };

  const decline = () => {
    setInvitation(null);
}

  const InvitationPopup = invitation ? (
    <div className="fixed top-4 right-4 z-500  animate-fadeIn">
      <div className="bg-white border shadow-xl rounded-2xl  w-xs sm:w-sm overflow-hidden">
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Join Flight<span className="font-mono font-extrabold text-orange-600"> {invitation.flightCode}</span> ? </h2> 
          <p className="text-md text-gray-600 mb-3">
            <span className="font-medium">{invitation.fromName}</span> wants to send you files.
            <br />
            <span className="text-sm text-gray-400">(from ID: {invitation.fromId})</span>
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={decline}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-md"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white text-md"
            >
              Accept
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-gray-200 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-1000"
            style={{ width: `${(timer / 60) * 100}%` }}
          />
        </div>
      </div>
    </div>
  ) : null;

  return InvitationPopup;
}
