// components/TermsModal.tsx
"use client";

import { useEffect } from "react";

export type TermsModalProps = {
  show: boolean;
  onClose: () => void;
  onAccept?: () => void;
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
      "Air Delivery enables you to send files directly between two devices using p2p connections.",
      "Files are never uploaded to or stored on any server we control. We only facilitate the signaling connection needed to establish the direct link.",
      "Transfers are ephemeral and end as soon as the browser tab is closed or the session ends.",
    ],
  },
  {
    heading: "2. Privacy & Data Handling",
    items: [
      "We do not collect or store personal information such as names, emails, or files.",
      "Your IP address may be partially used to discover nearby users on the same network. This data is never stored or shared.",
      "We use basic analytics tools to understand usage trends, including the total transfer size across all users. These tools may set cookies or collect anonymized device/browser information to help us improve the service.",
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
      "Air Delivery encryptes the data, direct connections, but we cannot guarantee absolute security due to the nature of internet communication.",
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
    items: ["Last updated: June 20, 2025"],
  },

];

export default function TermsModal({ show, onClose, onAccept }: TermsModalProps) {


  useEffect(() => {
    if (show) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white text-zinc-900 max-w-2xl w-full mx-4 p-5 rounded-2xl shadow-xl relative max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-zinc-500 hover:text-red-500"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-2">Terms & Privacy</h2>

        <section className="space-y-6 text-sm text-zinc-800">
          {termsContent.map(({ heading, items }, idx) => (
            <div key={idx}>
              {heading && <h3 className="text-base font-medium mb-2">{heading}</h3>}
              <ul className="list-disc list-inside space-y-1">
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {onAccept && (
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              Decline
            </button>
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="bg-orange-500 text-white text-sm px-4 py-2 rounded hover:bg-orange-600"
            >
              Accept Terms
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
