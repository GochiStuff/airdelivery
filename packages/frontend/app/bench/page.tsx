'use client';

import { useCallback, useRef, useState } from 'react';
import { useSocket } from '@/context/socketContext';

type Role = null | 'host' | 'join';
type Result = { mb: number; seconds: number; mbps: number } | null;

const ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function BenchPage() {
  const { socket } = useSocket();
  const [role, setRole] = useState<Role>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<Result>(null);
  const [chunkKB, setChunkKB] = useState(64);
  const [bufferMB, setBufferMB] = useState(2);
  const [totalMB, setTotalMB] = useState(256);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const queued = useRef<RTCIceCandidateInit[]>([]);
  const roomRef = useRef<string>('');
  const remoteIdRef = useRef<string>('');

  const addLog = (m: string) => setLog((l) => [...l.slice(-30), m]);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current?.close();
    dcRef.current = null;
    queued.current = [];
  }, []);

  const makePeer = useCallback(
    (remoteId: string, isHost: boolean) => {
      const pc = new RTCPeerConnection({ iceServers: ICE });
      pc.onicecandidate = (e) => {
        if (e.candidate) socket?.emit('ice-candidate', { id: remoteId, candidate: e.candidate });
      };
      pc.onconnectionstatechange = () => addLog(`pc: ${pc.connectionState}`);
      if (isHost) return pc;

      pc.ondatachannel = (e) => {
        dcRef.current = e.channel;
        attachReceiver(e.channel);
      };
      return pc;
    },
    [socket],
  );

  const attachReceiver = (dc: RTCDataChannel) => {
    let received = 0;
    let started = 0;
    dc.binaryType = 'arraybuffer';
    dc.onmessage = (e) => {
      if (typeof e.data === 'string') {
        if (e.data === 'start') {
          started = performance.now();
          addLog('receiving...');
        }
        return;
      }
      received += e.data.byteLength;
    };
    dc.onclose = () => {
      const s = started || performance.now();
      const sec = (performance.now() - s) / 1000;
      const mb = received / (1024 * 1024);
      setResult({ mb, seconds: sec, mbps: mb / sec });
      addLog(`done: ${mb.toFixed(0)}MB in ${sec.toFixed(2)}s = ${(mb / sec).toFixed(1)} MB/s`);
    };
  };

  const host = useCallback(() => {
    if (!socket) return;
    cleanup();

    socket.emit('createFlight', (resp: { code: string }) => {
      const room = resp.code;
      setCode(room);
      setRole('host');

      socket.emit('joinFlight', room, (jresp: { success: boolean; message?: string }) => {
        roomRef.current = room;
        addLog(`host joined ${room}: ${jresp.success ? 'ok' : jresp.message}`);
      });
    });
    socket.on('flightUsers', async ({ ownerId }: { ownerId: string }) => {
      if (socket.id !== ownerId || pcRef.current) return;
      const pc = makePeer('', true);
      pcRef.current = pc;
      pc.onicecandidate = (e) => {
        if (e.candidate) queued.current.push(e.candidate);
      };

      const dc = pc.createDataChannel('bench');
      dc.binaryType = 'arraybuffer';
      dcRef.current = dc;
      dc.onopen = () => addLog('bench channel open (host)');

      socket.on('answer', async ({ sdp, id }: { sdp: RTCSessionDescriptionInit; id: string }) => {
        remoteIdRef.current = id;
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit('ice-candidate', { id, candidate: e.candidate });
        };
        await pc.setRemoteDescription(sdp);
        for (const c of queued.current) await pc.addIceCandidate(c);
        queued.current = [];
        addLog('answer applied');
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', roomRef.current, { sdp: pc.localDescription });
      addLog('offer sent');
    });

    socket.on(
      'offer',
      async (id: string, { sdp }: { sdp: RTCSessionDescriptionInit }) => {
        addLog('unexpected offer on host');
        void id;
        void sdp;
      },
    );

    socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (pcRef.current?.remoteDescription) await pcRef.current.addIceCandidate(candidate);
      else queued.current.push(candidate);
    });
  }, [socket, code, cleanup, makePeer]);

  const join = useCallback(() => {
    if (!socket || !code) return;
    cleanup();
    setRole('join');

    socket.emit('joinFlight', code, (resp: { success: boolean; message?: string }) => {
      addLog(`join ${code}: ${resp.success ? 'ok' : resp.message}`);
    });

    socket.on(
      'offer',
      async (
        id: string,
        { sdp }: { sdp: { sdp: RTCSessionDescription } | RTCSessionDescriptionInit },
      ) => {
        // Server stores the host's whole { sdp } payload and re-wraps it, so
        // the description may arrive nested one level deeper.
        const desc = (sdp as any)?.sdp ?? sdp;
        if (!desc) {
          addLog('no offer yet, retrying...');
          setTimeout(() => socket.emit('joinFlight', code, () => {}), 1500);
          return;
        }
        if (pcRef.current) return;
        remoteIdRef.current = id;
        const pc = makePeer(id, false);
        pcRef.current = pc;

        await pc.setRemoteDescription(desc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') return resolve();
        const check = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', check);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', check);
      });

      socket.emit('answer', code, { sdp: answer, id });
      addLog('answer sent');
    });

    socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (pcRef.current?.remoteDescription) await pcRef.current.addIceCandidate(candidate);
      else queued.current.push(candidate);
    });
  }, [socket, code, cleanup, makePeer]);

  const run = useCallback(() => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== 'open') {
      addLog('channel not open');
      return;
    }
    const chunkSize = chunkKB * 1024;
    const highWater = bufferMB * 1024 * 1024;
    const totalBytes = totalMB * 1024 * 1024;

    dc.bufferedAmountLowThreshold = highWater / 2;
    const buf = new Uint8Array(chunkSize);
    let sent = 0;
    let paused = false;

    dc.onbufferedamountlow = () => {
      if (paused) {
        paused = false;
        pump();
      }
    };

    dc.send('start');

    function pump() {
      while (sent < totalBytes) {
        if (dc!.bufferedAmount > highWater) {
          paused = true;
          return;
        }
        dc!.send(buf);
        sent += chunkSize;
      }
      dc!.close();
    }

    const startedAt = performance.now();
    pump();
    addLog(`pumping ${totalMB}MB chunk=${chunkKB}KB buffer=${bufferMB}MB`);
    setResult(null);
    void startedAt;
  }, [chunkKB, bufferMB, totalMB]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-8 font-mono text-sm">
      <h1 className="text-xl font-bold">Transfer Benchmark</h1>
      <p className="text-gray-500">Open this page in two tabs. Tab A hosts, Tab B joins with the code.</p>

      <div className="flex flex-wrap gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="room code"
          className="rounded border px-2 py-1"
        />
        <button onClick={host} className="rounded bg-black px-3 py-1 text-white">
          Host
        </button>
        <button onClick={join} className="rounded bg-black px-3 py-1 text-white">
          Join
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label>
          chunk KB <input type="number" value={chunkKB} onChange={(e) => setChunkKB(+e.target.value)} className="w-20 rounded border px-1" />
        </label>
        <label>
          buffer MB <input type="number" value={bufferMB} onChange={(e) => setBufferMB(+e.target.value)} className="w-20 rounded border px-1" />
        </label>
        <label>
          total MB <input type="number" value={totalMB} onChange={(e) => setTotalMB(+e.target.value)} className="w-20 rounded border px-1" />
        </label>
        <button onClick={run} className="rounded bg-green-600 px-3 py-1 text-white">
          Run
        </button>
      </div>

      <div className="rounded border p-3">
        <div>status: {status || '—'}</div>
        {result && (
          <div className="mt-2 font-bold">
            {result.mbps.toFixed(1)} MB/s ({result.mb.toFixed(0)}MB in {result.seconds.toFixed(2)}s)
          </div>
        )}
      </div>

      <pre className="max-h-64 overflow-auto rounded bg-gray-100 p-2 text-xs">{log.join('\n')}</pre>
    </main>
  );
}
