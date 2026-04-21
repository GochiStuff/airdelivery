"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  File,
  Folder,
  Share2,
  Users,
  User,
  ScanQrCode,
  RefreshCwIcon,
  LogOut,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/lib/badge";
import { useWebRTCContext } from "@/context/WebRTCContext";
import { MetricsSection } from "@/components/room/MetricSection";
import { QueueTray } from "@/components/room/QueueTray";
import AsktoShareSection from "@/components/room/share";
import SharePopup from "@/components/AskForShare";


export default function RoomPage() {
  // --- route / flight code ------------------------------------------------
  const { code } = useParams();
  const flight = typeof code === "string" ? code : "";

  // --- local UI state ----------------------------------------------------
  const [showQR, setShowQR] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLeft, setIsLeft] = useState(false);

  const router = useRouter();

  // --- webRTC / transfers context ---------------------------------------
  const {
    handleFileSelect,
    meta,
    leaveFlight,
    connectToFlight,
    cancelTransfer,
    recvQueue,
    queue,
    autoDownload,
    setAutoDownload,
    downloadFile,
    resumeTransfer,
    pauseTransfer,
    status,
    members,
    refreshNearby,
    inviteToFlight,
    nearByUsers,
    flightId,
  } = useWebRTCContext();

  // --- handlers ----------------------------------------------------------
  const handleLeave = () => {
    setIsLeft(true);
    leaveFlight();
    router.push("/");
  };

  useEffect(() => {
    if (!flight) return;
    if (flightId === flight) return;
    if (isLeft) return;

    const handleSwitch = () => {
      if (flightId && flightId !== flight) {
        const leave = confirm(
          `You are already in flight "${flightId}". Leave it and join "${flight}"?`
        );
        if (leave) {
          leaveFlight();
          connectToFlight(flight);
        } else {
          router.push(`/flight/${flightId}`);
        }
      } else {
        connectToFlight(flight);
      }
    };

    handleSwitch();
  }, [flight, flightId, connectToFlight, leaveFlight, router, isLeft]);

  // Refresh nearby users with a short spin animation
  const handleRefresh = () => {
    setIsSpinning(true);
    refreshNearby();
    setTimeout(() => setIsSpinning(false), 500);
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-gray-300 text-zinc-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Share popup (kept as in original) */}
      <SharePopup />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-2xl shadow-xl p-6 sm:p-8 gap-6 mb-6 transition-all">
          {/* Left: Flight Info */}
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide flex items-center gap-2">
                FLIGHT
                <span className="bg-zinc-100  text-xl  sm:text-xl font-mono text-zinc-700 px-2 py-1 rounded-lg border border-zinc-200 ">
                  {flight}
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
              <Badge
                color={
                  typeof status === "string" && status.includes("Connection")
                    ? "green"
                    : status.includes("Failed")
                    ? "red"
                    : "yellow"
                }
              >
                {status}
              </Badge>

              <Badge color="gray">
                {members.length} Member{members.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap md:flex-nowrap items-start sm:items-center justify-start md:justify-end gap-3 md:gap-6 w-full md:w-auto">
            {/* Show QR button */}
            <div className="flex flex-col items-start sm:items-center">
              <button
                onClick={() => setShowQR((prev) => !prev)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md transition duration-200"
              >
                <ScanQrCode className="w-5 h-5 " />
                <span className="text-sm">Show</span>
              </button>

              <span className="text-xs hidden md:inline text-zinc-500 mt-1 sm:text-center">
                Show QR or code
              </span>
            </div>

            {/* Leave flight button */}
            <div className="flex flex-col items-start sm:items-center">
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold shadow-md transition duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden text-sm md:inline">Leave</span>
              </button>

              <span className="text-xs hidden md:inline text-zinc-500 mt-1 sm:text-center">
                Leave the flight
              </span>
            </div>
          </div>
        </header>

        {/* QR Share Modal (keeps exact structure & content) */}
        {showQR && (
          <div className="fixed animate-fadeIn inset-0 bg-zinc-900/60 h-screen flex items-center justify-center z-50">
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center border-2 border-orange-400">
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-3 right-3 text-zinc-400 hover:text-orange-600 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>

              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-lg bg-orange-100 text-orange-700 px-3 py-1 rounded-lg border border-orange-200">
                  {flight}
                </span>
              </div>

              <h2 className="text-xl font-bold text-zinc-900 mb-3 text-center">Share this Flight</h2>

              <div className="flex justify-center mb-4">
                <QRCodeSVG
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  size={180}
                />
              </div>

              <div className="w-full flex flex-col items-center mb-2">
                <div className="flex items-center gap-2 w-full">
                  <input
                    className="flex-1 bg-zinc-100 rounded-lg px-2 py-1 text-sm font-mono border border-zinc-200 text-zinc-700"
                    value={typeof window !== "undefined" ? window.location.href : ""}
                    readOnly
                    onFocus={(e) => e.target.select()}
                  />

                  <button
                    onClick={async () => {
                      if (typeof window !== "undefined" && navigator.share) {
                        await navigator.share({
                          title: "Join my Flight",
                          text: "Join my Flight on AirDelivery!",
                          url: window.location.href,
                        });
                      }
                    }}
                    className="p-1 rounded hover:bg-orange-100 text-orange-600"
                    title="Share via OS"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                <span className="text-xs text-zinc-500 mt-1">Ask the reciver to join.</span>
              </div>

              <p className="mt-2 text-sm text-zinc-600 text-center">Scan QR or share the link to join this flight.</p>
            </div>
          </div>
        )}

        {/* Main Content: Upload area + Users panel + Queue */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload area (left / large) */}
          <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-3xl shadow-md flex flex-col items-center justify-center">
            <div
              className="w-full h-56 flex flex-col items-center justify-center border-2 border-dashed border-orange-400 rounded-2xl bg-white hover:bg-orange-50 transition cursor-pointer p-6 text-center"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = Array.from(e.dataTransfer.files);
                handleFileSelect({ target: { files } } as any);
              }}
            >
              <Folder className="w-12 h-12 text-orange-500 mb-3" />
              <p className="text-lg font-medium text-zinc-800">Drag & Drop files or folders</p>
              <span className="mt-1 text-sm text-zinc-500">or select manually</span>

              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {/* Select files button */}
                <label className="px-5 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center gap-2 text-sm cursor-pointer transition">
                  <File className="w-4 h-4" />
                  <span>Select Files</span>
                  <input type="file" multiple hidden onChange={handleFileSelect} />
                </label>

                {/* Select folder button */}
                <label className="px-5 py-2 rounded-full border border-orange-500 text-orange-600 hover:bg-orange-50 font-medium flex items-center gap-2 text-sm cursor-pointer transition">
                  <Folder className="w-4 h-4" />
                  <span>Select Folder</span>
                  <input
                    type="file"
                    multiple
                    hidden
                    //@ts-ignore
                    webkitdirectory="true"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Users Panel (right / small) */}
          <div className="bg-white rounded-3xl shadow-md p-5 max-h-96 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-zinc-800">
                  {members.length <= 1 ? "Nearby Users" : "In Flight"}
                </h2>
              </div>

              {members.length <= 1 && (
                <button
                  onClick={handleRefresh}
                  className="p-2 rounded-full hover:bg-zinc-100 transition"
                  title="Refresh"
                >
                  <RefreshCwIcon
                    className={`w-5 h-5 ${isSpinning ? "animate-spin" : "transition-transform"}`}
                  />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {(members.length <= 1 ? nearByUsers : members).length === 0 ? (
                <div className="text-zinc-400 text-sm text-center py-6">
                  {members.length <= 1 ? "No nearby users" : "No members"}
                </div>
              ) : (
                (members.length <= 1 ? nearByUsers : members).map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => members.length <= 1 && inviteToFlight(m, flight)}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-2 border border-zinc-200 hover:border-orange-400 hover:bg-orange-50 transition text-left focus:ring-2 focus:ring-orange-200"
                    title={members.length <= 1 ? `Connect to ${m.name}` : m.name}
                  >
                    <User className="w-6 h-6 text-orange-500 bg-orange-100 hover:bg-orange-300 rounded-full p-1" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900 truncate">{m.name}</span>
                      <span className="text-xs text-zinc-500 font-mono truncate">ID: {m.id}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Queue preview */}
        <div className="mt-6 w-full space-y-6">
          <QueueTray
            title="Transfer Queue"
            items={[...queue, ...recvQueue]}
            pauseTransfer={pauseTransfer}
            resumeTransfer={resumeTransfer}
            cancelTransfer={cancelTransfer}
            fileDownload={downloadFile}
            autoDownload={autoDownload}
            setAutoDownload={setAutoDownload}
          />
        </div>

        {/* Metrics and share info */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricsSection meta={meta} />
          <AsktoShareSection />
        </section>
      </div>
    </main>
  );
}
