'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import HistoryDrawer from './HistoryDrawer';
import { Github, Clock, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <HistoryDrawer show={showSheet} onClose={() => setShowSheet(false)} />

      <header className="w-full h-16 flex items-center justify-between px-6 md:px-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 transition-all duration-300">
        {/* Brand Section */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group active:scale-95 transition-transform"
        >
          <Image
            src="/icons/logo.png"
            alt="AirDelivery Logo"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <span className="text-xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase select-none">
            AIR DELIVERY
          </span>
        </Link>

        {/* Action Group */}
        <nav className="flex items-center gap-1 sm:gap-4">
          {/* PC Only Icons */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <a
              href="https://x.com/imgochi"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Follow on X"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4.5 h-4.5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
            </a>
          </div>

          {/* Persistent GitHub Link */}
          <a
            href="https://github.com/GochiStuff/airdelivery"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title="Star on GitHub"
          >
            <Github className="w-5 h-5" />
          </a>

          {/* Unified Hub Trigger */}
          <button
            onClick={() => setShowSheet(true)}
            className="p-2 ml-1 rounded-lg text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all active:scale-90"
            aria-label="Toggle Menu"
          >
            <div className="md:hidden">
              <Menu className="w-6 h-6" />
            </div>
            <div className="hidden md:block">
              <Clock className="w-5 h-5 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
            </div>
          </button>
        </nav>
      </header>
    </>
  );
}
