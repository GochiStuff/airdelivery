import { Download, File, Pause, Play, X, ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Switch } from "../ui/switch";
import Image from "next/image";

interface QueueTrayProp {
  title: string;
  items: any[];
  pauseTransfer?: (id: string) => void;
  fileDownload?: (file: {
    transferId: string;
    blobUrl: string;
    directoryPath: string;
  }) => void;
  openfile?: (url: string) => void;
  autoDownload?: boolean;
  setAutoDownload?: (b: boolean) => void;
  resumeTransfer?: (id: string) => void;
  cancelTransfer?: (id: string) => void;
}

export function QueueTray({
  title,
  items,
  pauseTransfer,
  fileDownload,
  autoDownload,
  setAutoDownload,
  resumeTransfer,
  cancelTransfer,
}: QueueTrayProp) {
  const statusLabels: Record<string, string> = {
    queued: "Queued",
    sending: "Sending",
    paused: "Paused",
    done: "Done",
    error: "Error",
    canceled: "Canceled",
  };

  const [show, setShow] = useState(false);

  return (
    <div className="bg-white  relative rounded-2xl shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
 
      <div className="absolute top-3 right-4 flex gap-2">
        {typeof autoDownload !== "undefined" && (
          <button
            className="text-xs font-medium text-orange-500"
            onClick={() => setShow(true)}
          >
            Auto Download?
          </button>
        )}
      </div>

      {show && typeof autoDownload !== "undefined" && (
        <div className="absolute top-8 right-2 z-50 max-w-102 rounded-xl border bg-white p-4 shadow-xl animate-fadeIn">
          <div className="flex justify-end mb-2">
            <button onClick={() => setShow(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Switch
              checked={autoDownload}
              onCheckedChange={setAutoDownload}
              id="auto-download-toggle"
            />
            <label htmlFor="auto-download-toggle" className="text-sm">
              Auto-download
            </label>
          </div>
          {!autoDownload && (
            <p className="text-sm text-orange-500 mb-2">
              Auto-download is off. Use download buttons below each file.
            </p>
          )}
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Use manual download if blocked.</li>
            <li className="text-orange-600">Use Opera if issue persists.</li>
            <li>Upload ZIPs for multiple small files.</li>
            <li>Start a fresh session if stuck.</li>
            <li>Large files (~500MB+) stream directly.</li>
          </ul>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 p-2">
        {items.length === 0 ? (
          <div className="flex flex-col h-56 items-center justify-center w-full text-zinc-400 py-8">
            <File className="w-8 h-8 mb-2" />
            <span className="text-sm">No transfers yet</span>
          </div>
        ) : (
          items.map((item) => {
            const isReceive = item.type === "receive";
            const icon = isReceive ? (
              <ArrowDown className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowUp className="w-4 h-4 text-blue-500" />
            );

            return (
              <div
                key={item.transferId}
                className="relative w-48 flex-shrink-0 rounded-2xl outline-1 outline-zinc-300 bg-white shadow-md  hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Direction Icon */}
                <div className="absolute top-2 left-2 bg-white/80 p-1  rounded-full  shadow-md ">
                  {icon}
                </div>

                {/* Thumbnail */}
                {item.thumbnail ? (
                  <div className="w-full h-32 bg-zinc-100">
                    <Image
                      src={item.thumbnail}
                      alt="Thumbnail"
                      width={224}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-zinc-100 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center shadow-inner">
                      <File className="w-6 h-6 text-zinc-500" />
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="flex flex-col items-center text-center px-3 py-2 gap-1">
                  <span className="text-sm font-medium text-zinc-800 truncate w-full">
                    {item.file?.name || item.name || item.directoryPath}
                  </span>

                  {/* Progress */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>

                  <div className="w-full flex justify-between text-[11px] text-zinc-500 mt-1 font-medium">
                    <span>{item.progress}%</span>
                    <span>{statusLabels[item.status] || item.status}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="w-full flex justify-center items-center gap-2 py-2 mb-1">
                  {isReceive ? (
                    <>
                      {item.status !== "done" && item.status !== "canceled" && (
                        <button
                          className="rounded-full p-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 transition"
                          onClick={() => cancelTransfer?.(item.transferId)}
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {item.status === "done" && item.downloaded ? (
                        <p className="text-[11px] text-zinc-500 font-semibold">Downloaded</p>
                      ) : (
                        item.status === "done" &&
                        !autoDownload &&
                        item.blobUrl && (
                          <button
                            className="rounded-full p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-500 border border-blue-200 transition"
                            onClick={() => fileDownload?.(item)}
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </>
                  ) : (
                    <>
                      {item.status === "paused" && (
                        <button
                          className="rounded-full p-1.5 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 transition"
                          onClick={() => resumeTransfer?.(item.transferId)}
                          title="Resume"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {item.status === "sending" && (
                        <button
                          className="rounded-full p-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border border-yellow-200 transition"
                          onClick={() => pauseTransfer?.(item.transferId)}
                          title="Pause"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {item.status !== "done" && item.status !== "canceled" && (
                        <button
                          className="rounded-full p-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 transition"
                          onClick={() => cancelTransfer?.(item.transferId)}
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
