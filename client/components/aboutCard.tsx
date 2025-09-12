"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const whatsNewInfo = [
  
  {
    title: "🛜 One Click Nearby Connect",
    content:
      "Instantly detect and connect to nearby devices over the same Wi-Fi network. Just drag and drop.",
  },
  {
    title: "🌍 Remote Flights",
    content:
      "Connect remotely with a secure code, link, or QR — even across different networks.",
  },
  {
    title: "🍕 Coming Soon...",
    content:
      "- Save trusted devices, Group share, password up, preview file and more!",
  },
  {
    title: "🧪 Just Launched",
    content:
      "This is the initial release. Bugs may exist. Your feedback will help us improve and grow.",
  },
];

export default function WhatsNewCard() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div>
      <button
        aria-label="What's New in Air Delivery"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-zinc-300 animate-pulse hover:text-orange-500 transition-colors"
      >
        What’s New?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 m-4 mt-20 shadow-2xl text-zinc-800 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-2xl text-zinc-400 hover:text-zinc-700 transition"
            >
              &times;
            </button>

            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">
              What's New in Air Delivery 🚀
            </h2>
            <p className="text-sm text-zinc-500 mb-4">
              Here's what we've been working on.
            </p>

        
            <div className="mb-6 rounded-xl overflow-hidden shadow">
              <iframe
                className="w-full aspect-video rounded-xl"
                src="https://www.youtube.com/embed/l_YP2RgcyHY?autoplay=1&mute=1&loop=1&playlist=l_YP2RgcyHY&controls=0"
                title="YouTube video player"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>



            

            <div className="space-y-5 text-sm md:text-base leading-relaxed">
              {whatsNewInfo.map(({ title, content }) => (
                <div key={title}>
                  <h3 className="font-semibold text-zinc-800 mb-1">{title}</h3>
                  <div className="text-zinc-600">{content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
