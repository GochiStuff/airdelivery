"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import TermsModal from "./terms";

export default function FooterStrip() {
  const [showTerms, setShowTerms] = useState(false);
  const router = useRouter();

  return (
    <>
      <footer className="w-full border-t border-zinc-800 bg-zinc-950 text-zinc-500 text-sm px-6 py-5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-center">
          <button aria-labelledby="terms and privacy"
            onClick={() => setShowTerms(true)}
            className="transition text-zinc-400 hover:text-white hover:underline"
          >
            Terms & Privacy
          </button>

          <button aria-labelledby="Guide for p2p file sharing and webRTC"
            onClick={() => router.push("/guide/p2p-file-sharing")}
            className="transition text-zinc-400 hover:text-white hover:underline"
          >
            Guide
          </button>

          <span className="hidden sm:inline text-zinc-700 select-none">|</span>

          <span  aria-labelledby="author" className="text-xs sm:text-sm text-zinc-500">
            Built with <span className="text-pink-400">❤️</span> by{" "}
            <a
              href="https://x.com/gochistuff"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline font-medium"
            >
              Yash Jangid
            </a>{" "}
            · © {new Date().getFullYear()} AirDelivery
          </span>
        </div>
      </footer>

      <TermsModal show={showTerms} onClose={() => setShowTerms(false)} />
    </>
  );
}
