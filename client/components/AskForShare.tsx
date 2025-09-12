"use client";

import {
  Check,
  Share2,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const SharePopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = "https://airdelivery.site";
  const shareText = encodeURIComponent("Send files instantly and privately with AirDelivery!");

  useEffect(() => {
    const hidePopup = localStorage.getItem("hideSharePopup");
    if (!hidePopup) {
      const timer = setTimeout(() => setShowPopup(true),  90 * 1000); // show after 1.5 min
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCopy = () => {
    setLinkCopied(false);
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
  };

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("hideSharePopup", "true");
    }
    setShowPopup(false);
  };

  const links = {
    whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}%20${shareUrl}`,
    telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
    instagram: `https://www.instagram.com`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?url=${shareUrl}&title=${shareText}`,
  };

  return showPopup ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-w-md w-full rounded-xl bg-white p-6 shadow-xl relative text-gray-800">
        <button
          onClick={handleClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-black text-xl font-bold"
        >
          ×
        </button>

        <h3 className="text-lg font-semibold mb-2 text-blue-700">
          💙 Thanks for using AirDelivery!
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          We don’t ask for anything — just share AirDelivery with your friends
          to support us and help us grow. Running this site costs money, but
          your support and feedback keeps it alive and helps us bring more features.
        </p>

        <div
          className="mb-4 flex items-center justify-between rounded-md bg-gray-200 px-3 py-2 font-mono text-sm text-gray-800"
          onClick={handleCopy}
        >
          <span>{shareUrl}</span>
          <button
            title="Copy Link"
            onClick={handleCopy}
            className={
              !linkCopied
                ? `ml-2 text-gray-100 bg-zinc-900 p-2 hover:bg-zinc-500 rounded-full hover:text-gray-300`
                : `ml-2 text-green-100 bg-green-900 p-2 hover:bg-green-500 rounded-full hover:text-green-300`
            }
          >
            {linkCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex gap-1 text-lg">
            <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" title="WhatsApp">
              <img className="w-8 h-8" width="240" height="240" src="https://img.icons8.com/color/240/whatsapp--v1.png" alt="whatsapp--v1"/>
            </a>
            <a href={links.twitter} target="_blank" rel="noopener noreferrer" title="Twitter">
              <img  className="h-8 w-8" width="240" height="240" src="https://img.icons8.com/color/240/twitterx--v1.png" alt="twitterx--v1"/>
            </a>
            <a href={links.instagram} target="_blank" rel="noopener noreferrer" title="Facebook">
                <img className="w-8 h-8" width="240" height="240" src="https://img.icons8.com/fluency/240/instagram-new.png" alt="instagram-new"/>
            </a>
            <a href={links.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
              <img  className="w-8 h-8" width="240" height="240" src="https://img.icons8.com/color/240/facebook-new.png" alt="facebook-new"/>
            </a>
            <a href={links.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
              <img className="h-8 w-8" width="240" height="240" src="https://img.icons8.com/color/240/linkedin.png" alt="linkedin"/>
            </a>
            <a href={links.telegram} target="_blank" rel="noopener noreferrer" title="Telegram">
              <img className="h-8 w-8" width="240" height="240" src="https://img.icons8.com/color/240/telegram-app--v1.png" alt="telegram-app--v1"/>
            </a>
          </div>

          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              className="mr-2"
              checked={dontShowAgain}
              onChange={() => setDontShowAgain(!dontShowAgain)}
            />
            Don’t show this again
          </label>
        </div>
      </div>
    </div>
  ) : null;
};

export default SharePopup;
