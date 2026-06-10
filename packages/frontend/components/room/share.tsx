'use client';
import { useEffect, useState } from "react";
import { Heart, Share2 } from "lucide-react";

export default function AskToShareSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
     
      setDeferredPrompt(null);
      setCanInstall(false);
    } else {
      alert("Tip: You can install this app from your browser menu.");
    }
  };

  return (
    <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-lg p-5 sm:p-6 flex flex-col gap-5 border dark:border-zinc-800">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Love AirDelivery?
          </h3>
        </div>

        <p className="text-zinc-700 dark:text-zinc-400 text-sm sm:text-base mb-3">
          If you enjoy using this app,{" "}
          <span className="font-semibold text-blue-600 dark:text-blue-400">share it</span> or install.
        </p>

        <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-500 text-sm space-y-2">
          <li>
            <strong className="text-zinc-800 dark:text-zinc-300">Tip:</strong> Connect both devices on the same network for optimal speed.
          </li>
          <li>
            <strong className="text-zinc-800 dark:text-zinc-300">Note:</strong> Avoid refreshing after connection is established.
          </li>
          <li>
            <strong className="text-red-500">IMP:</strong> Use Opera (suggested) or a different browser if site isn't working.
          </li>
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium shadow-md transition"
          onClick={async () => {
            if (typeof window !== "undefined" && navigator.share) {
              try {
                await navigator.share({
                  title: "Try AirDelivery!",
                  text: "Send files instantly with AirDelivery",
                  url: window.location.origin,
                });
              } catch {}
            } else if (typeof window !== "undefined") {
              await navigator.clipboard.writeText(window.location.origin);
              alert("Link copied! Share it with friends.");
            }
          }}
        >
          <Share2 className="w-5 h-5" />
          Share App
        </button>

        <button
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 ${
            canInstall ? "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
          } rounded-2xl font-medium shadow-sm transition`}
          onClick={handleInstallClick}
          disabled={!canInstall}
        >
          Install
        </button>
      </div>
    </div>
  );
}
