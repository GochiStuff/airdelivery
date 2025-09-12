// components/InfoModal.tsx
"use client";

import { useEffect } from "react";
import Script from "next/script";
import { ExternalLink, icons } from "lucide-react";
import { useRouter } from "next/navigation";

type InfoModalProps = {
  popupContent: "terms" | "faq";
  closePopup: () => void;
};

const termsContent = [
  {
    heading: "",
    items: [
        "By using this service, you agree to these terms. If you do not agree, please do not use Air Delivery.",
    ],
  },
  {
    heading: "1. File Transfers",
    items: [
      "Air Delivery enables you to send files directly between two devices using WebRTC peer-to-peer connections.",
      "Files are never uploaded to or stored on any server we control. We only facilitate the signaling connection needed to establish the direct link.",
      "Transfers are ephemeral and end as soon as the browser tab is closed or the session ends.",
    ],
  },
  {
    heading: "2. Privacy & Data Handling",
    items: [
      "We do not collect or store personal information such as names, emails, or files.",
      "Your IP address may be partially used to discover nearby users on the same network. This data is never stored or shared.",
      "We use basic analytics tools to understand usage trends. These tools may set cookies or collect anonymized device/browser information.",
    ],
  },
  {
    heading: "3. Acceptable Use",
    items: [
      "You agree not to use Air Delivery to share content that is illegal, harmful, or violates intellectual property rights.",
      "You are solely responsible for the files you choose to share.",
      "We reserve the right to block IPs or users abusing the platform, including spamming, malicious use, or attempts to overload infrastructure.",
    ],
  },
  {
    heading: "4. Security Disclaimer",
    items: [
      "Air Delivery uses WebRTC for encrypted, direct connections, but we cannot guarantee absolute security due to the nature of internet communication.",
      "Always verify the recipient and file before accepting a transfer. We are not responsible for any damages, losses, or issues resulting from file sharing via Air Delivery.",
    ],
  },
  {
    heading: "5. Limitation of Liability",
    items: [
      "This service is provided 'as is' without warranties of any kind.",
      "We are not liable for data loss, failed transfers, or any damages arising from use or misuse of the service.",
    ],
  },
  {
    heading: "Updates to These Terms",
    items: [
      "Last updated: June 20, 2025",
    ],
  },
  {
    heading: "Contact",
    items: [
      "Have questions, feedback, or legal inquiries? Contact the developer at: gsdevelopment04@gmail.com",
    ],
  },
];


const faqEntries: Array<{ question: string; answer: string }> = [
  {
    question: "How does Air Delivery work?",
    answer:
      "It uses peer-to-peer (P2P) technology over WebRTC to connect your browser directly with another browser. No files are uploaded to any server.",
  },
  {
    question: "Is it secure?",
    answer:
      "Yes. Files transfer directly between devices; no intermediary stores them. Even we cannot access or view your files.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No installation needed. Open Air Delivery in any modern browser on desktop or mobile, and you’re ready to transfer files.",
  },
  {
    question: "Can I send from phone to laptop (or across networks)?",
    answer:
      "Absolutely. As long as both devices open the site and are online, the WebRTC connection works across networks (with TURN fallback if necessary).",
  },
  {
    question: "Is it free?",
    answer:
      "100% free and without ads in the current version. We may introduce optional paid features in the future, but basic P2P transfers remain free.",
  },
  {
    question: "Can I use this without internet?",
    answer:
      "No. but Yes While file transfer is peer-to-peer, initial signaling requires an internet connection to coordinate the WebRTC handshake. If both user are on same wifi/network there transfer don't use internet. ",
  },
  {
    question: "Who made this?",
    answer: "Built with ❤️ by Yash Jangid. Feedback and contributions are always welcome!",
  },
];

export function InfoModal({ popupContent, closePopup }: InfoModalProps) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const router = useRouter();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  return (
    <>
   
      {popupContent === "faq" && (
        <Script
          id="faq-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div className="bg-white text-zinc-900 max-w-2xl w-full mx-4 p-5 rounded-2xl shadow-xl relative max-h-[80vh] overflow-y-auto">
       
          
          <button
            onClick={closePopup}
            aria-label="Close"
            className="absolute top-3 right-3 text-zinc-500 hover:text-red-500"
          >
            ✕
          </button>
          <h2 id="info-modal-title" className="text-xl font-semibold">
            {popupContent === "terms" ? "Terms & Privacy" : "Frequently Asked Questions"}
          </h2>
           <button
            onClick={() => router.push('/guide/p2p-file-sharing')}
            aria-label="Close"
            className="  text-orange-500 mt-2 flex gap-1 mb-4 hover:text-orange-200"
          >
            <ExternalLink className="w-4" />
           Go to detailed guide
          </button>

          {popupContent === "terms" ? (
            <section className="space-y-6 text-sm text-zinc-800">
              {termsContent.map(({ heading, items }) => (
                <div key={heading}>
                  <h3 className="text-base font-medium mb-2">{heading}</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : (
            <section className="space-y-6 text-sm text-zinc-800">
              {faqEntries.map(({ question, answer }, idx) => (
                <div key={idx}>
                  <h3 className="text-base font-medium">{question}</h3>
                  <p className="mt-1">{answer}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
