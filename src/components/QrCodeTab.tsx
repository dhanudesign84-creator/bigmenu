import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download, ExternalLink, Printer, Copy, Check } from "lucide-react";
import type { Restaurant } from "../types";

interface QrCodeTabProps {
  restaurant: Restaurant;
}

export const QrCodeTab: React.FC<QrCodeTabProps> = ({ restaurant }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate Menu URL
  const menuUrl = typeof window !== "undefined" ? `${window.location.origin}/menu` : "http://localhost:3000/menu";

  useEffect(() => {
    QRCode.toDataURL(
      menuUrl,
      {
        width: 600,
        margin: 2,
        color: {
          dark: "#1F1F1F",
          light: "#FFFFFF",
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [menuUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${restaurant.name.toLowerCase().replace(/\s+/g, "-")}-qr-menu.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#F8CB46] text-[#1F1F1F] flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1F1F1F]">Restaurant Menu QR Code</h2>
            <p className="text-xs text-[#686868]">
              Customers scan this QR code on their phones to view your live digital menu
            </p>
          </div>
        </div>

        {/* Printable Standee Card Preview */}
        <div className="max-w-md mx-auto bg-gradient-to-b from-[#1F1F1F] to-[#121212] text-white p-6 sm:p-8 rounded-3xl shadow-xl text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F8CB46] text-[#1F1F1F] flex items-center justify-center font-black text-xl mb-3 shadow-md">
            {restaurant.name.charAt(0) || "A"}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-[#F8CB46] tracking-tight uppercase">
            {restaurant.name}
          </h3>
          <p className="text-xs text-gray-300 font-medium mt-1">
            {restaurant.subtitle}
          </p>

          <div className="my-6 p-4 bg-white rounded-2xl shadow-inner inline-block">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Menu QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
            ) : (
              <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-xl" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-white tracking-wide">
              SCAN TO VIEW DIGITAL MENU
            </p>
            <p className="text-[11px] text-gray-400">
              No App Download Required • Instant Live Menu
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownloadQR}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0a6e1a] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res QR</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1F1F1F] text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Link Copied!" : "Copy Menu Link"}</span>
          </button>

          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-[#1F1F1F] text-xs sm:text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Menu Preview</span>
          </a>
        </div>
      </div>
    </div>
  );
};
