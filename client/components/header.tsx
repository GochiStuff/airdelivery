"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
export default function Header() {
  const isLoggedIn = false;

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-10 backdrop-blur-md border-b bg-white shadow-lg h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image src="/icons/logo.png" alt="Logo" width={40} height={40} />
          <Link
            href="/"
            className="text-xl md:text-2xl font-semibold tracking-tighter text-zinc-900"
          >
            AIR DELIVERY
          </Link>
        </div>

        <nav className="flex items-center gap-2 text-sm md:text-base font-medium p-2  text-white">
          <span className="opacity-90 text-black">Dev</span>
          <a
            href={`https://x.com/GochiStuff`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-400 transition"
            title="Share on Twitter"
          >
            <div className="bg-black p-2  rounded-full">
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.53 3H21l-7.19 8.21L22 21h-6.56l-5.18-6.44L4.47 21H1l7.64-8.73L2 3h6.68l4.74 5.91L17.53 3ZM16.3 19h2.13l-5.82-7.23-1.71 1.98L16.3 19ZM5.09 5l5.38 6.69 1.7-1.97L7.36 5H5.09Z" />
              </svg>
            </div>
          </a>
        </nav>

      </header>
    </>
  );
}
