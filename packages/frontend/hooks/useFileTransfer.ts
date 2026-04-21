"use client";

import { useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import PQueue from "p-queue";
import pRetry from "p-retry";
// @ts-ignore
import * as lz4 from 'lz4js';
import { flattenFileList } from "@/utils/flattenFilelist";
import { v4 } from "uuid";
import { generateThumbnail } from "@/lib/generateThumbnail";

// ----------------------------- Types -----------------------------------

type TransferStatus =
  | "queued"
  | "sending"
  | "paused"
  | "done"
  | "error"
  | "canceled"
  | "receiving";

type Transfer = {
  file: File;
  transferId: string;
  directoryPath: string;
  progress: number;
  type?: "send" | "receive";
  speedBps: number;
  status: TransferStatus;
  thumbnail?: string;
};

type RecvTransfer = {
  transferId: string;
  directoryPath: string;
  size: number;
  received: number;
  progress: number;
  blobUrl?: string;
  type: "send" | "receive";
  downloaded?: boolean;
  status: TransferStatus;
  thumbnail?: string;
};

type Meta = {
  totalSent: number;
  totalReceived: number;
  speedBps: number;
};

export function useFileTransfer(
  dataChannel: RTCDataChannel | null,
  disconnect: () => void,
  updateStats: (files: number, transfer: number) => void
) {
  const [queue, setQueue] = useState<Transfer[]>([]);
  const [recvQueue, setRecvQueue] = useState<RecvTransfer[]>([]);
  const [meta, setMeta] = useState<Meta>({
    totalSent: 0,
    totalReceived: 0,
    speedBps: 0,
  });

  // --- Constants / tuning  ( MOST OF THESE WERE SET AFTER BENCHMARKING DIFF SETTINGS ) ---------------------------------------------
  const MAX_RAM_SIZE = 1.2 * 1024 * 1024 * 1024; // 1.2 GB
  const peerMax = (dataChannel as any)?.maxMessageSize || 256 * 1024;
  const CHUNK_SIZE = Math.min(256 * 1024, Math.floor(peerMax * 0.9));
  const BUFFER_THRESHOLD = CHUNK_SIZE * 8;
  const PROGRESS_INTERVAL_MS = 500;

  // We store partial incoming transfers here to avoid re-rendering on each chunk
  const incoming = useRef<
    Record<
      string,
      {
        size: number;
        received: number;
        writing: boolean;
        queue: ArrayBuffer[];
        lastProgressUpdate: number;
        writer: WritableStreamDefaultWriter | null;
      }
    >
  >({});

  // track which transfer is currently being processed by the writer
  const currentReceivingIdRef = useRef<string | null>(null);

  const pq = useRef(new PQueue({ concurrency: 1 }));

  const transferControls = useRef<
    Record<
      string,
      {
        paused: boolean;
        resumePromise?: Promise<void>;
        resumeResolve?: () => void;
        canceled: boolean;
      }
    >
  >({});

  const statusMap: Record<TransferStatus, string> = {
    queued: "Waiting to send",
    sending: "Transferring",
    paused: "Paused",
    done: "Completed",
    error: "Failed",
    canceled: "Canceled",
    receiving: "Receiving",
  };

  // ------------------------- Download helpers ---------------------------

  function downloadFile(file: {
    transferId: string;
    blobUrl: string;
    directoryPath: string;
  }) {
    const a = document.createElement("a");

    a.href = file.blobUrl;
    a.download = file.directoryPath;
    a.style.display = "none";
    document.body.appendChild(a);

    requestAnimationFrame(() => {
      a.click();
      document.body.removeChild(a);
    });

    setTimeout(() => {
      URL.revokeObjectURL(file.blobUrl);

      setRecvQueue((prev) =>
        prev.map((f) =>
          f.transferId === file.transferId ? { ...f, downloaded: true } : f
        )
      );
    }, 2000);
  }

  function openFile(blobUrl: string) {
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  }

  async function downloadAll() {
    for (const file of recvQueue) {
      if (file.status === "done" && file.blobUrl && !file.downloaded) {
        const a = document.createElement("a");
        a.href = file.blobUrl;
        a.download = file.directoryPath;
        document.body.appendChild(a);
        a.click();
        a.remove();

        await new Promise((res) => setTimeout(res, 100));
      }
    }
  }

  const [autoDownload, setAutoDownload] = useState(false);
  function tryAutoDownload(url: string, filename: string) {
    if (autoDownload) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 800);
    }
  }

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const files = await flattenFileList(e.target.files);

      const transfers = await Promise.all(
        files.map(async (file) => {
          const id = v4();
          const thumb = await generateThumbnail(file);
          transferControls.current[id] = { paused: false, canceled: false };
          return {
            file,
            transferId: id,
            directoryPath: (file as any).webkitRelativePath || file.name,
            progress: 0,
            speedBps: 0,
            status: "queued" as const,
            thumbnail: thumb,
          };
        })
      );

      // Avoid duplicates by directoryPath
      setQueue((prev) => {
        const existing = new Set(prev.map((t) => t.directoryPath));
        return [...prev, ...transfers.filter((t) => !existing.has(t.directoryPath))];
      });
    },
    []
  );


  async function* readFileInChunks(file: File) {
    const reader = file.stream().getReader();
    let buffer = new Uint8Array(0);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer = concat(buffer, new Uint8Array(value));
      while (buffer.length >= CHUNK_SIZE) {
        yield buffer.slice(0, CHUNK_SIZE);
        buffer = buffer.slice(CHUNK_SIZE);
      }
    }
    if (buffer.length) yield buffer;
  }

  function concat(a: Uint8Array, b: Uint8Array) {
    const c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
  }

  // [transferIdLength][transferId][chunkSize][chunk]
  function createPacket(transferId: string, chunk: Uint8Array) {
    const transferIdBuf = new TextEncoder().encode(transferId);
    const headerSize = 4 + transferIdBuf.length + 4;
    const packet = new ArrayBuffer(headerSize + chunk.byteLength);
    const view = new DataView(packet);

    let offset = 0;
    view.setUint32(offset, transferIdBuf.length);
    offset += 4;

    new Uint8Array(packet, offset, transferIdBuf.length).set(transferIdBuf);
    offset += transferIdBuf.length;

    view.setUint32(offset, chunk.byteLength);
    offset += 4;

    new Uint8Array(packet, offset).set(new Uint8Array(chunk));

    return packet;
  }

  // ---------------------------- SEND ------------------------------------
  const sendFile = useCallback(
    async ({ file, transferId, directoryPath, thumbnail }: Transfer) => {
      // Ensure data channel is available and open
      if (!dataChannel) throw new Error("No dataChannel");
      if (dataChannel.readyState !== "open")
        throw new Error("Connection is not open");

      const controls = transferControls.current[transferId];
      if (!controls) throw new Error("No controls for transfer");

      const total = file.size;
      let sent = 0;
      let lastTime = Date.now();
      let lastSent = 0;

      dataChannel.send(
        JSON.stringify({ type: "init", transferId, directoryPath, size: total, thumbnail })
      );

      for await (const chunk of readFileInChunks(file)) {
        
        if (controls.canceled) {
          dataChannel.send(JSON.stringify({ type: "cancel", transferId }));
          setQueue((q) =>
            q.map((x) =>
              x.transferId === transferId ? { ...x, status: "canceled" } : x
            )
          );
          throw new Error("Canceled");
        }
        if (controls.paused) {
          dataChannel.send(JSON.stringify({ type: "pause", transferId }));
          await controls.resumePromise;
          dataChannel.send(JSON.stringify({ type: "resume", transferId }));
        }

        // Backpressure 
        if (dataChannel.bufferedAmount > BUFFER_THRESHOLD) {
          await new Promise<void>((res) => {
            const listener = () => {
              dataChannel.onbufferedamountlow = null;
              res();
            };
            dataChannel.bufferedAmountLowThreshold = BUFFER_THRESHOLD;
            dataChannel.onbufferedamountlow = listener;
          });
        }
        if (dataChannel.readyState !== "open")
          throw new Error("Connection closed");

        const compressed = lz4.compress(chunk);
        const packet = createPacket(transferId, compressed);
        dataChannel.send(packet);

        // Progress tracking (throttled)
        sent += chunk.length;
        const now = Date.now();
        const pct = (sent / total) * 100;
        if (
          now - lastTime > PROGRESS_INTERVAL_MS ||
          pct - (lastSent / total) * 100 >= 5
        ) {
          setQueue((q) =>
            q.map((x) =>
              x.transferId === transferId
                ? { ...x, progress: Math.round(pct) }
                : x
            )
          );
          const bytesSinceLast = sent - lastSent;
          const timeElapsedSec = (now - lastTime) / 1000;
          const speed =
            timeElapsedSec > 0 ? Math.round(bytesSinceLast / timeElapsedSec) : 0;
          setMeta((m) => ({ ...m, speedBps: speed }));
          lastTime = now;
          lastSent = sent;
        }
      }

      // Signal completion and update queues/meta
      dataChannel.send(JSON.stringify({ type: "done", transferId }));
      setQueue((q) =>
        q.map((x) =>
          x.transferId === transferId
            ? { ...x, progress: 100, status: "done" }
            : x
        )
      );
      setMeta((m) => ({ ...m, totalSent: m.totalSent + total }));
    },
    [dataChannel]
  );

  // ------------------------- RECEIVE  ---------------------------
  function unpack(buffer: ArrayBuffer) {
    const view = new DataView(buffer);
    let offset = 0;

    const transferIdLength = view.getUint32(offset);
    offset += 4;

    const transferId = new TextDecoder().decode(
      new Uint8Array(buffer, offset, transferIdLength)
    );

    offset += transferIdLength;

    const chunkSize = view.getUint32(offset);
    offset += 4;

    const chunk = buffer.slice(offset, offset + chunkSize);

    return { transferId, chunk };
  }

  async function ProcessRecQue(transferId: string) {
    // Process the queued decompressed chunks for a given transfer and write them
    const rec = incoming.current[transferId];

    if (!rec) {
      console.warn("No matching incoming entry for:", transferId);
      currentReceivingIdRef.current = null;
      return;
    }

    try {
      while (rec.queue.length > 0) {
        const chunk = rec.queue.shift();
        if (!chunk) continue;

        try {
          if (!rec.writer) return;
          await rec.writer.write(new Uint8Array(chunk));
          rec.received += chunk.byteLength;

          if (
            !rec.lastProgressUpdate ||
            Date.now() - rec.lastProgressUpdate > PROGRESS_INTERVAL_MS
          ) {
            setRecvQueue((rq) =>
              rq.map((r) =>
                r.transferId === transferId && r.status === "receiving"
                  ? {
                      ...r,
                      received: rec.received,
                      progress: Math.round((rec.received / rec.size) * 100),
                    }
                  : r
              )
            );
            rec.lastProgressUpdate = Date.now();
          }
        } catch (err) {
          console.error("Writer error:", err);
          try {
            if (!rec.writer) return;
            await rec.writer.abort?.();
          } catch {}
          delete incoming.current[transferId];
          setRecvQueue((rq) =>
            rq.map((r) =>
              r.transferId === transferId ? { ...r, status: "error" } : r
            )
          );
          return;
        }
      }

      // If we've received the full file, close the writer and finalize state
      if (rec.received >= rec.size) {
        try {
          if (!rec.writer) return;
          await rec.writer.close();
        } catch {}
        rec.writing = false;
        rec.writer = null;
        currentReceivingIdRef.current = null;
        delete incoming.current[transferId];

        const temp = meta.totalReceived + rec.received;
        setMeta((m) => ({
          ...m,
          totalReceived: temp,
        }));

        setRecvQueue((rq) =>
          rq.map((r) =>
            r.transferId === transferId
              ? { ...r, status: "done", progress: 100 }
              : r
          )
        );

        await new Promise((res) => setTimeout(res, 50));
      }
    } finally {
      rec.writing = false;
    }
  }

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (typeof event.data === "string") {
        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          console.warn("Received string but not JSON:", event.data);
          return;
        }
        const { type, transferId, directoryPath, size, thumbnail } = msg;

        if (type === "chunk") {
          currentReceivingIdRef.current = transferId;
          return;
        }

        // INIT message: prepare writer and metadata for incoming transfer
        if (type === "init") {
          try {
            let writer: WritableStreamDefaultWriter;
            let chunks: Uint8Array[] | undefined = undefined;
            let downloaded = false;

            if (size < MAX_RAM_SIZE) {
              // Small file: buffer in-memory and produce a blob at the end
              chunks = [];
              writer = {
                write: (chunk: Uint8Array) => {
                  chunks!.push(chunk);
                  return Promise.resolve();
                },
                close: () => {
                  const totalLength = chunks!.reduce((sum, c) => sum + c.length, 0);
                  const all = new Uint8Array(totalLength);
                  let offset = 0;
                  for (const c of chunks!) {
                    all.set(c, offset);
                    offset += c.length;
                  }

                  const blob = new Blob([all]);
                  const url = URL.createObjectURL(blob);
                  setRecvQueue((rq) =>
                    rq.map((r) =>
                      r.transferId === transferId ? { ...r, blobUrl: url } : r
                    )
                  );

                  tryAutoDownload(url, directoryPath);

                  if (chunks?.length) chunks.length = 0;

                  return Promise.resolve();
                },
                abort: () => {
                  chunks = undefined;
                  return Promise.resolve();
                },
                // Minimal stubs to satisfy WritableStreamDefaultWriter shape
                get closed() {
                  return Promise.resolve();
                },
                get desiredSize() {
                  return null;
                },
                get ready() {
                  return Promise.resolve();
                },
                releaseLock: () => {},
              } as WritableStreamDefaultWriter<any>;
            } else {
              // Large file: stream to disk using streamsaver
              const streamSaver = (await import("streamsaver")).default;
              const stream = streamSaver.createWriteStream(directoryPath, {
                size,
              });

              downloaded = true;
              writer = stream.getWriter();
            }

            incoming.current[transferId] = {
              writer,
              queue: [],
              writing: false,
              size,
              received: 0,
              lastProgressUpdate: 0,
            };

            setRecvQueue((rq) => [
              ...rq,
              {
                transferId,
                directoryPath,
                blobUrl: "",
                size,
                type: "receive",
                downloaded,
                received: 0,
                progress: 0,
                status: "receiving",
                thumbnail,
              },
            ]);
          } catch (err) {
            console.error("Error creating write stream:", err);
            setRecvQueue((rq) =>
              rq.map((r) =>
                r.transferId === transferId ? { ...r, status: "error" } : r
              )
            );
          }
          return;
        }

        // CONTROL messages (pause/resume/cancel)
        if (type === "pause") {
          setRecvQueue((rq) =>
            rq.map((r) =>
              r.transferId === transferId && r.status === "receiving"
                ? { ...r, status: "paused" }
                : r
            )
          );
          return;
        }
        if (type === "resume") {
          setRecvQueue((rq) =>
            rq.map((r) =>
              r.transferId === transferId && r.status === "paused"
                ? { ...r, status: "receiving" }
                : r
            )
          );
          return;
        }
        if (type === "cancel") {
          // Cancel an incoming transfer
          if (incoming.current[transferId]) {
            try {
              if (!incoming.current[transferId].writer) return;
              incoming.current[transferId].writer.abort();
            } catch {}
            delete incoming.current[transferId];
            setRecvQueue((rq) =>
              rq.map((r) =>
                r.transferId === transferId ? { ...r, status: "canceled" } : r
              )
            );
            return;
          }
          // Or remote cancelled our outgoing send -> mark as canceled locally
          if (transferControls.current[transferId]) {
            const controls = transferControls.current[transferId];
            controls.canceled = true;
            if (controls.paused && controls.resumeResolve) {
              controls.paused = false;
              controls.resumeResolve();
            }
            setQueue((q) =>
              q.map((x) =>
                x.transferId === transferId ? { ...x, status: "canceled" } : x
              )
            );
          }
          return;
        }

        // DONE (no-op here, writer close handled in ProcessRecQue)
        if (type === "done") {
          return;
        }
        return;
      }

      // ----------------- Binary data path -----------------
      const { transferId, chunk } = unpack(event.data);

      const rec = incoming.current[transferId];
      if (!rec) return;

      // Decompress the received chunk and queue it for writing
      const decompressed = lz4.decompress(new Uint8Array(chunk));
      rec.queue.push(decompressed.buffer);
      if (!rec.writing) {
        rec.writing = true;
        ProcessRecQue(transferId);
      }
    },
    [recvQueue]
  );

  // ------------------------- Reset / cancel ----------------------------
  function resetTransfer() {
    // Cancel all ongoing controls and clear state
    Object.values(transferControls.current).forEach((ctrl) => {
      ctrl.canceled = true;
      if (ctrl.paused && ctrl.resumeResolve) {
        ctrl.paused = false;
        ctrl.resumeResolve();
      }
    });

    transferControls.current = {};
    setQueue([]);

    // Abort any active incoming writers
    Object.values(incoming.current).forEach((rec) => {
      rec.writer?.abort();
    });

    incoming.current = {};
    setRecvQueue([]);
    setMeta({ totalReceived: 0, totalSent: 0, speedBps: 0 });
  }

  // ------------------------- Setup handlers ----------------------------
  useEffect(() => {
    if (!dataChannel) return;
    dataChannel.binaryType = "arraybuffer";
    dataChannel.bufferedAmountLowThreshold = BUFFER_THRESHOLD;
    dataChannel.onmessage = handleMessage;
    dataChannel.onopen = () => {};
    dataChannel.onclose = () => {
      // Mark all sending transfers as paused and call disconnect
      setQueue((q) =>
        q.map((t) => {
          if (t.status === "sending") {
            transferControls.current[t.transferId].paused = true;
            return { ...t, status: "paused" as const };
          }
          return t;
        })
      );

      disconnect();
    };
    dataChannel.onerror = (err) => {
      // on any datachannel error we disconnect (original behavior)
      disconnect();
    };
    return () => {
      dataChannel.onmessage = null;
      dataChannel.onopen = null;
      dataChannel.onclose = null;
      dataChannel.onerror = null;
    };
  }, [dataChannel, handleMessage]);

  // ----------------------- SENDING QUEUE runner -------------------------
  useEffect(() => {
    if (dataChannel?.readyState !== "open") return;
    queue.forEach((t) => {
      if (t.status !== "queued") return;
      // mark as sending and enqueue the send job
      setQueue((q) =>
        q.map((x) =>
          x.transferId === t.transferId ? { ...x, status: "sending" } : x
        )
      );
      pq.current
        .add(() => pRetry(() => sendFile(t), { retries: 0 }))
        .catch((err) => {
          if (err.message === "Canceled") {
            // already handled when canceled
          } else {
            console.error("Send failed for", t.transferId, err);
            setQueue((q) =>
              q.map((x) =>
                x.transferId === t.transferId ? { ...x, status: "error" } : x
              )
            );
          }
        });
    });
  }, [queue, dataChannel, sendFile]);

  // Re-run queued sends whenever the dataChannel becomes open
  useEffect(() => {
    if (!dataChannel) return;
    const onOpen = () => {
      setQueue((prev) => [...prev]);
    };

    if (dataChannel.readyState === "open") {
      onOpen();
    }

    dataChannel.addEventListener("open", onOpen);

    return () => {
      dataChannel.removeEventListener("open", onOpen);
    };
  }, [dataChannel]);

  // ------------------------- Control helpers ---------------------------
  const pauseTransfer = useCallback((transferId: string) => {
    setQueue((q) =>
      q.map((x) => {
        if (
          x.transferId === transferId &&
          (x.status === "sending" || x.status === "queued")
        ) {
          const controls = transferControls.current[transferId];
          if (controls) {
            controls.paused = true;
            controls.resumePromise = new Promise((res) => {
              controls.resumeResolve = res;
            });
          }
          return { ...x, status: "paused" };
        }
        return x;
      })
    );
  }, []);

  const resumeTransfer = useCallback((transferId: string) => {
    setQueue((q) =>
      q.map((x) => {
        if (x.transferId === transferId && x.status === "paused") {
          const controls = transferControls.current[transferId];
          if (controls) {
            controls.paused = false;
            controls.resumeResolve?.();
            controls.resumePromise = undefined;
            controls.resumeResolve = undefined;
          }
          const nextStatus = x.progress > 0 ? "sending" : "queued";
          return { ...x, status: nextStatus };
        }
        return x;
      })
    );
  }, []);

  const cancelTransfer = useCallback(
    (transferId: string) => {
      // Mark local send as canceled and notify remote
      const controls = transferControls.current[transferId];
      if (controls) {
        controls.canceled = true;
        if (controls.paused && controls.resumeResolve) {
          controls.paused = false;
          controls.resumeResolve();
        }
      }
      setQueue((q) =>
        q.map((x) =>
          x.transferId === transferId ? { ...x, status: "canceled" } : x
        )
      );
      if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(JSON.stringify({ type: "cancel", transferId }));
      }
    },
    [dataChannel]
  );

  const cancelReceive = useCallback(
    (transferId: string) => {
      // Cancel a receiving transfer and notify remote
      const rec = incoming.current[transferId];
      if (rec) {
        if (!rec.writer) return;
        try {
          rec.writer.abort();
        } catch {}
        delete incoming.current[transferId];
      }
      setRecvQueue((rq) =>
        rq.map((r) =>
          r.transferId === transferId ? { ...r, status: "canceled" } : r
        )
      );
      if (currentReceivingIdRef.current === transferId) {
        currentReceivingIdRef.current = null;
      }
      if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(JSON.stringify({ type: "cancel", transferId }));
      }
    },
    [dataChannel]
  );

  // STATUS view for consumers
  const userQueue = queue.map((t) => ({
    ...t,
    userStatus: statusMap[t.status],
  }));

  // --------------------------- Return ------------------------------
  return {
    queue: userQueue,
    downloadAll,
    downloadFile,
    resetTransfer,
    openFile,
    recvQueue,
    meta,
    setAutoDownload,
    autoDownload,
    handleFileSelect,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    setMeta,
    setQueue,
    setRecvQueue,
    cancelReceive,
    handleMessage,
  };
}
