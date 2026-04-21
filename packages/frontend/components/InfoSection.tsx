"use client"
import type React from "react"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react";

const features = [
  "Lightning fast",
  "Cross-platform",
  "No middleman",
  "End-to-end encrypted",
  "No size limits",
  "No sign-up required",
  "Room-based sharing",
  "Drag & drop support",
  "P2P architecture",
  "Mobile + desktop ready",
  "QR code pairing",
  "Battery-efficient",
  "No install needed",
  "Real-time status",
  "Progress tracking",
  "Pause + resume",
  "Secure by default",
  "Instant setup",
  "Multi-file sharing",
  "Lightweight engine",
  "No data stored",
  "...and more",
];

const InfoSection = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [type, setType] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "thanks" | "error">("idle")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const url = process.env.NEXT_PUBLIC_SOCKET || "http://localhost:5500"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic client-side validation
    if (name.trim().length === 0 || name.length > 100) {
      alert("Name must be between 1 and 100 characters.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.")
      return
    }

    if (message.trim().length === 0 || message.length > 500) {
      alert("Message must be between 1 and 500 characters.")
      return
    }



    setStatus("sending")

    try {
      const res = await fetch(`${url}/api/v1/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, type, message }),
        credentials: "include",
      })

      if (res.ok) {
        setStatus("thanks")
      } else if (res.status === 429) {
        setStatus("error")
      } else {
        setStatus("error")
      }
    } catch (error) {
      setStatus("error")
    }
  }

    const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <main className=" antialiased">
      {/* Hero Section */}
      <section className="py-12 bg-zinc-950 text-white md:py-32 px-6 sm:px-12 lg:px-24 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-none mb-8">
            Share files <span className="text-orange-500">instantly</span>.<br />
            No middleman.
          </h2>
          <h1 className="text-xl md:text-2xl text-neutral-400 max-w-3xl leading-relaxed">
            Secure, encrypted peer-to-peer file sharing with no size limits, no sign-ups, and transfers at 100+ Mbps.
          </h1>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 md:py-32 px-6 sm:px-12 lg:px-24 border-b bg-accent border-black/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 md:mb-20 tracking-tight">The numbers speak</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
            <div>
              <p className="text-5xl font-bold text-orange-500 mb-2 md:mb-4">TBs+</p>
              <p className="text-xl text-neutral-700">Data Shared</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-orange-500 mb-2 md:mb-">20K+</p>
              <p className="text-xl text-neutral-700">Users in First Month</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-orange-500 mb-2 md:mb-">27K+</p>
              <p className="text-xl text-neutral-700">Share Sessions</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-32 px-6 sm:px-12 lg:px-24 border-b   border-black/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 tracking-tight">How it works</h2>
          <ol className="space-y-12 text-xl">
            <li className="flex items-start">
              <div>
                <h3 className="text-2xl font-semibold mb-2">
                  Open <span className="text-orange-500">airdelivery.site</span> on both devices
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Works on any modern browser, no installation required.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Share from one device, join from the other</h3>
                <p className="text-neutral-600 leading-relaxed">Simple interface with minimal steps to connect.</p>
              </div>
            </li>
            <li className="flex items-start">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Transfer directly, peer-to-peer</h3>
                <p className="text-neutral-600 leading-relaxed">End-to-end encrypted with no server uploads.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Features */}
       <section className="py-12 md:py-32 px-6 sm:px-12 lg:px-24 border-b bg-zinc-900 text-white border-white/10">
  <div className="max-w-5xl mx-auto">
    <h2 className="text-4xl md:text-5xl font-bold mb-12 tracking-tight">
      Packed with everything - Key Features
    </h2>
    <div className="flex flex-wrap gap-3 text-sm sm:text-base">
      {features.map((title, i) => (
        <span
          key={i}
          className={`px-3 py-1.5 rounded bg-white/5 text-neutral-300 hover:bg-white/10 transition-colors duration-300 ${
            title === "...and more" ? "opacity-60 italic" : ""
          }`}
        >
          {title}
        </span>
      ))}
    </div>
  </div>
</section>



      {/* Testimonials - THESE ARE ALL  FROM EITHER THE FEED BACK   OR THE REDDIT */}
      <section className="py-12 md:py-32 px-6 sm:px-12 lg:px-24 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-20 tracking-tight">What people say</h2>
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "mangage", quote: "It really should have just always been this easy. Great work!" },
              { name: "Emotional-Pain", quote: "no logins...that's what I like so much" },
              {
                name: "Aromatic-Surround",
                quote:
                  "THIS IS AWESOME. LOVED IT. I have felt stuck since I moved to Android and can't use Airdrop any more so this is a life saver!! Good work!",
              },
            ].map((t, i) => (
              <div
                key={i}
                className=" p-4 sm:p-6 text-left  hover:bg-white/10 hover:text-orange-500 shadow-2xl hover:shadow-orange-500/50 transition-colors"
              >
                <blockquote className="text-sm sm:text-base mb-4">"{t.quote}"</blockquote>
                <footer className="text-xs sm:text-sm text-neutral-400">— {t.name}</footer>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* FAQ */}
      <section className="py-12 md:py-3 px-6 sm:px-12 lg:px-24 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-20 tracking-tight">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "How does Air Delivery work?",
                a: "It uses peer-to-peer (P2P) technology to connect your browser directly with another.",
              },
              {
                q: "Is it secure?",
                a: "Yes. Files transfer directly between devices; no intermediary can access them—not even us.",
              },
              {
                q: "Do I need to install anything?",
                a: "No installation. Just open the site in any modern browser, desktop or mobile. For quick access you can install the PWA via your browser.",
              },
              {
                q: "Is it available on Play Store or App Store?",
                a: "Not yet. You can install the PWA from your browser for quick access. Native apps are coming soon - stay tuned!",
              },
              {
                q: "Can I send from phone to laptop or across networks?",
                a: "Yes. As long as both devices are online and have the site open, transfers will work.",
              },
              {
                q: "Is it free?",
                a: "Yes. Completely free and ad-free. Optional paid features may come later, but P2P will remain free.",
              },
              {
                q: "Can I use this without internet?",
                a: "Yes, if both devices are on the same WiFi, transfer happens on the network only.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-black/15 pb-4">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full text-left flex justify-between items-center py-2 text-base sm:text-lg font-medium hover:text-orange-500 transition-colors"
                >
                  {faq.q}
                  <span className="text-orange-500 text-xl">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}




      {/* Feedback */}
      <section id="feedback" className="py-12 bg-zinc-900 text-white md:py-32 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Get in touch</h2>
         

          {status === "thanks" ? (
            <div className="text-center py-16">

              <p className="text-2xl animate-pulse flex gap-2 justify-center text-green-600 mb-4">
                <CheckCircle2 className="w-7 h-7" />Thank you!</p>
              <p className="text-xl text-neutral-400">We've received your feedback and will get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 text-left" aria-describedby="feedback-instructions" noValidate>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="fb-name" className="block text-sm text-neutral-400 mb-2">
                    Your Name
                  </label>
                  <input
                    id="fb-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-none text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="fb-email" className="block text-sm text-neutral-400 mb-2">
                    Your Email
                  </label>
                  <input
                    id="fb-email"
                    name="email"
                    type="email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-none text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors duration-300"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="fb-type" className="block text-sm text-neutral-400 mb-2">
                  Type
                </label>
                <input
                  id="fb-type"
                  name="type"
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  placeholder="Bug / Suggestion / Feedback"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-none text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors duration-300"
                />
              </div>
              <div>
                <label htmlFor="fb-message" className="block text-sm text-neutral-400 mb-2">
                  Your Message
                </label>
                <textarea
                  id="fb-message"
                  name="message"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Tell us what you think..."
                  className="w-full p-4 bg-white/5 border  border-white/10  text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500 transition-colors duration-300"
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="px-8 py-4 bg-orange-600 text-white rounded-sm hover:bg-orange-700 text-lg font-medium transition-colors duration-300"
              >
                {status === "sending" ? "Sending…" : "Send Feedback"}
              </button>
              {status === "error" && (
                <p className="text-red-400 mt-4">Oops! Something went wrong. Please try again later.</p>
              )}
            </form>
          )}
        </div>
      </section>

    </main>
  )
}

export default InfoSection
