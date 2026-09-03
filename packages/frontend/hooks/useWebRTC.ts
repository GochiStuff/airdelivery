import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/context/socketContext';
import { useRouter } from 'next/navigation';

type Candidate = RTCIceCandidateInit;

type Member = {
  id: string;
  name: string;
};

export function useWebRTC(onMessage: (e: MessageEvent) => void) {
  const [flightCode, setFlightCode] = useState<string | null>(null);
  const { socket } = useSocket();
  const peer = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const controlChannel = useRef<RTCDataChannel | null>(null);
  const [status, setStatus] = useState('Waiting for someone to join…');
  const [members, setMembers] = useState<Member[]>([]);
  const [ownerId, setOwnerId] = useState<string>('');
  const [nearByUsers, setNearByUsers] = useState<Member[]>([]);
  const queuedCandidates = useRef<RTCIceCandidateInit[]>([]);
  const queuedOwnerCandidates = useRef<RTCIceCandidateInit[]>([]);
  const router = useRouter();

  function connectToFlight(code: string) {
    setFlightCode(code);
  }

  // PEER CONNECTION
  function createPeer(id: string) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ],
    });

    let iceRestarted = false;
    pc.onconnectionstatechange = () => {
      const state = peer.current?.connectionState;
      if (state === 'disconnected') {
        if (!iceRestarted) {
          iceRestarted = true;
          setStatus('Connection lost — reconnecting…');
          pc.restartIce();
          setTimeout(() => {
            if (peer.current?.connectionState === 'disconnected') disconnect();
          }, 5000);
        } else {
          disconnect();
        }
      }
      if (state === 'failed' || state === 'closed') {
        disconnect();
      }
      if (state === 'connected') {
        iceRestarted = false;
        setStatus('Connected');
      }
    };

    const isOwner = socket?.id === id;

    pc.onicecandidate = (e) => {
      if (e.candidate && socket?.id) {
        if (isOwner) {
          // OWNER: Buffer own candidates until joiner's socket id is known (comes with the answer).
          queuedOwnerCandidates.current.push(e.candidate);
        } else {
          // JOINER: Remote id is known from the offer — send immediately.
          socket?.emit('ice-candidate', { id, candidate: e.candidate });
        }
      }
    };

    return pc;
  }

  function disconnect() {
    if (peer.current) {
      peer.current.onicecandidate = null;
      peer.current.ondatachannel = null;
      peer.current.close();
      peer.current = null;
    }

    if (dataChannel.current) {
      dataChannel.current.onmessage = null;
      dataChannel.current.onopen = null;
      dataChannel.current.close();
      dataChannel.current = null;
    }

    if (controlChannel.current) {
      controlChannel.current.onmessage = null;
      controlChannel.current.onopen = null;
      controlChannel.current.close();
      controlChannel.current = null;
    }

    setFlightCode(null);
    setStatus('Disconnected');
    setOwnerId('');
    setMembers([]);
    queuedCandidates.current = [];
    queuedOwnerCandidates.current = [];

    socket?.emit('leaveFlight');
  }

  // SENDER (owner/host side)
  async function initiateSender() {
    if (!peer.current) return;

    // Bulk data channel for file chunks, plus a dedicated control channel so
    // JSON messages (init/pause/cancel) never queue behind chunk floods.
    dataChannel.current = peer.current.createDataChannel('fileTransfer');
    dataChannel.current.onopen = () => setStatus('Connected');
    dataChannel.current.onmessage = onMessage;

    controlChannel.current = peer.current.createDataChannel('control', { ordered: true });
    controlChannel.current.onmessage = onMessage;

    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    setStatus('Waiting for other side to connect…');
    socket?.emit('offer', flightCode, { sdp: peer.current.localDescription });
  }

  // RECEIVER (joiner side)
  async function handleOffer(id: string, sdp: RTCSessionDescriptionInit) {
    setStatus('Connecting…');
    peer.current = createPeer(id);

    peer.current.ondatachannel = (e) => {
      if (e.channel.label === 'control') {
        controlChannel.current = e.channel;
      } else {
        dataChannel.current = e.channel;
      }
      e.channel.onmessage = onMessage;
      e.channel.onopen = () => setStatus('Connected');
    };

    await peer.current.setRemoteDescription(sdp);
    flushBufferedCandidates();

    const answer = await peer.current.createAnswer();
    await peer.current.setLocalDescription(answer);

    // Send answer immediately (trickle ICE) — waiting for ICE gathering here
    // causes a ~1 min delay because the host doesn't wait either.
    socket?.emit('answer', flightCode, { sdp: answer });
  }

  // SENDER — handle answer from joiner
  async function handleAnswer(sdp: RTCSessionDescriptionInit, remoteId: string) {
    if (!peer.current) return;

    // Now we know the remote socket id — update ICE candidate handler to send directly.
    peer.current.onicecandidate = (e) => {
      if (e.candidate && socket?.id) {
        socket?.emit('ice-candidate', { id: remoteId, candidate: e.candidate });
      }
    };

    try {
      await peer.current.setRemoteDescription(sdp);
      flushBufferedCandidates();

      // Flush buffered outgoing candidates to joiner now that we have their id.
      for (const candidate of queuedOwnerCandidates.current) {
        socket?.emit('ice-candidate', { id: remoteId, candidate });
      }
      queuedOwnerCandidates.current = [];
    } catch (e) {
      console.error('Failed to set remote description', e);
      setStatus('Connection failed — try refreshing');
    }
  }

  // ICE candidate received from remote peer
  async function handleIce(id: string, candidate: Candidate) {
    try {
      if (peer.current?.remoteDescription) {
        await peer.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        queuedCandidates.current.push(candidate);
      }
    } catch (err) {
      console.error('Failed to add ICE candidate', err);
    }
  }

  // Flush any remote ICE candidates that arrived before setRemoteDescription
  const flushBufferedCandidates = async () => {
    for (const c of queuedCandidates.current) {
      try {
        await peer.current?.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.error('Failed to add buffered ICE', e);
      }
    }
    queuedCandidates.current = [];
  };

  async function refreshNearby() {
    socket?.emit('getNearbyUsers');
  }

  const updateStats = (files: number, transferred: number) => {
    socket?.emit('updateStats', {
      filesShared: files,
      Transferred: transferred,
    });
  };

  async function inviteToFlight(user: Member, currentFlightCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      socket?.emit(
        'inviteToFlight',
        {
          targetId: user.id,
          flightCode: currentFlightCode,
        },
        (res: { success: boolean; message?: string }) => {
          if (res.success) {
            resolve();
          } else {
            console.error('Invite failed:', res.message);
            reject(res.message);
          }
        },
      );
    });
  }

  useEffect(() => {
    if (!socket || !flightCode) return;

    socket.on('offer', async (id, { sdp }) => {
      if (!sdp) {
        setStatus('Connection failed — try refreshing');
        return;
      }
      await handleOffer(id, sdp.sdp);
    });

    socket.on('answer', async ({ sdp, id }) => {
      await handleAnswer(sdp, id);
    });

    socket.on('ice-candidate', async ({ candidate, id }) => {
      await handleIce(id, candidate);
    });

    socket.on('nearbyUsers', (users: Member[]) => {
      setNearByUsers(users);
    });

    socket.emit('joinFlight', flightCode, (resp: { success: boolean; message?: string }) => {
      if (resp.success) {
        setStatus('Waiting for someone to join…');
      } else {
        if (resp.message === 'Flight is full') {
          router.push('/flightFull');
        } else {
          setStatus(`Could not join — ${resp.message}`);
        }
      }
    });

    socket.on('flightUsers', ({ ownerId: oid, members: m }) => {
      setOwnerId(oid);
      setMembers(m);

      if (socket?.id === oid && !peer.current) {
        peer.current = createPeer(oid);
        initiateSender();
      }

      socket.emit('getNearbyUsers');
    });

    return () => {
      socket.off('flightUsers');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('nearbyUsers');

      if (peer.current) {
        peer.current.close();
        peer.current = null;
      }
    };
  }, [socket, flightCode]);

  return {
    dataChannel: dataChannel.current,
    controlChannel: controlChannel.current,
    status,
    nearByUsers,
    inviteToFlight,
    updateStats,
    connectToFlight,
    refreshNearby,
    disconnect,
    members,
  };
}
