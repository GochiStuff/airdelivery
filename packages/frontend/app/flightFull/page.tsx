"use client";
import { ArrowLeftCircle } from "lucide-react";
import Link from "next/link";

export default function FlightFullPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-orange-100 text-center">
        
        <h1 className="text-3xl font-extrabold text-orange-600 mb-4 tracking-tight">
          Flight Full
        </h1>
        <p className="text-zinc-600 text-base mb-6">
          Sorry, you can't join this flight right now. Only 1-2 users are allowed per flight for now.
        </p>

        <div className="text-sm text-zinc-500 italic mb-8">
          We're working on increasing the limit and allowing more users to join soon 🚀
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all duration-200 shadow-sm"
        >
          <ArrowLeftCircle className="w-5 h-5" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
