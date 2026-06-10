"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getHistory, clearHistory, HistoryItem } from "@/lib/history";
import { X, Trash2, Clock, ArrowDown, ArrowUp, FileText, Github, ChevronRight } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function HistoryDrawer({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (show) {
      loadHistory();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  async function loadHistory() {
    const data = await getHistory();
    setHistory(data);
  }

  async function handleClear() {
    if (confirm("Clear all transfer history?")) {
      await clearHistory();
      setHistory([]);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/30 dark:bg-black/60 backdrop-blur-[4px] transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] bg-white dark:bg-zinc-950 h-full shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-none border-l border-zinc-200 dark:border-zinc-800 flex flex-col animate-slide-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Settings & Global Actions */}
        <div className="p-6 border-b dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none">Hub</h2>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-1">Management & History</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-1.5 px-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Appearance</span>
              <ThemeToggle />
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://x.com/imgochi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-[11px] font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-3.5 h-3.5 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                </svg>
                X.com
              </a>
              <a
                href="https://github.com/GochiStuff/airdelivery"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-[11px] font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Middle Section - History List */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 italic">Recent Archive</h3>
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                </div>
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">No Transfers Found</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-700 mt-1 max-w-[160px]">Activity will appear here after you share files.</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id + item.timestamp}
                  className="group flex items-center gap-4 p-3 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-2xl hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-default"
                >
                  <div className="relative w-11 h-11 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-5 h-5 text-zinc-400" />
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-zinc-950 rounded-full p-1 border border-zinc-100 dark:border-zinc-900 shadow-sm">
                      {item.type === "send" ? (
                        <ArrowUp className="w-2.5 h-2.5 text-blue-500" />
                      ) : (
                        <ArrowDown className="w-2.5 h-2.5 text-green-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate uppercase tracking-tight leading-tight">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
                        {formatBytes(item.size)}
                      </span>
                      <span className="w-0.5 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                      <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500">
                        {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                    item.status === "done"
                      ? "bg-green-500/5 text-green-600 border-green-500/20"
                      : "bg-red-500/5 text-red-600 border-red-500/20"
                  }`}>
                    {item.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer - Branding */}
        <div className="p-8 mt-auto border-t dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
          <div className="flex flex-col items-center gap-2 opacity-30 dark:opacity-20 grayscale hover:opacity-100 transition-all duration-500 cursor-default">
            <Image src="/icons/logo.png" alt="Logo" width={24} height={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 dark:text-white">AirDelivery • Site</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0.8; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
