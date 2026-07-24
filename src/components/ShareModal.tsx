import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, Download, QrCode, ExternalLink, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getPublicUrl = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      return `${origin}${pathname}?view=pendaftaran`;
    }
    return 'https://sdnulujami06pagi.sch.id/pendaftaran';
  };

  const publicUrl = getPublicUrl();

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, publicUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#047857', // emerald-700
          light: '#ffffff'
        }
      }, (err) => {
        if (err) console.error('Error generating QR code:', err);
      });
    }
  }, [isOpen, publicUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWa = () => {
    const text = `*FORMULIR PENDAFTARAN EKSKUL SEPAKBOLA SDN ULUJAMI 06 PAGI*\n\nHalo Bapak/Ibu Wali Murid,\nBerikut adalah link resmi pendaftaran & daftar ulang ekskul sepakbola SDN Ulujami 06 Pagi:\n\n👉 ${publicUrl}\n\nSilakan buka link di atas melalui HP/Laptop Anda untuk mengisi formulir pendaftaran. Terima kasih!`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleDownloadQR = () => {
    if (canvasRef.current) {
      const imageUri = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'QR_Code_Pendaftaran_Ekskul_Sepakbola_SDN_Ulujami_06_Pagi.png';
      link.href = imageUri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-100 overflow-hidden relative"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <Share2 className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-yellow-400 text-emerald-950 font-black text-[10px] rounded-full uppercase tracking-wider">
                    Link Pendaftaran Publik
                  </span>
                  <h3 className="text-xl font-black uppercase text-white tracking-tight mt-0.5">
                    Bagikan Formulir Wali Murid
                  </h3>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              
              {/* URL Display Box */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Link Tautan Publik (Siswa / Wali Murid)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-medium text-slate-800 truncate select-all">
                    {publicUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shrink-0 shadow-sm ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-yellow-400 hover:bg-yellow-300 text-emerald-950'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Salin
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons: WhatsApp & Open tab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleShareWa}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Share ke WhatsApp Group
                </button>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-slate-200 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                  Buka Link di Tab Baru
                </a>
              </div>

              {/* QR Code Section */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-md border border-emerald-200 shrink-0">
                  <canvas ref={canvasRef} className="w-36 h-36 rounded-lg"></canvas>
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black text-emerald-900 uppercase">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Scan QR Code Pendaftaran</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Wali murid dapat langsung menscan QR Code ini menggunakan kamera HP untuk mendaftar secara mandiri.
                  </p>
                  <button
                    onClick={handleDownloadQR}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline uppercase tracking-wider pt-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Gambar QR Code (.PNG)
                  </button>
                </div>
              </div>

              {/* Footer notice */}
              <div className="text-[11px] text-slate-500 font-medium text-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                💡 <strong className="text-slate-700">Petunjuk Admin:</strong> Tempelkan link ini di pengumuman sekolah atau bagikan ke WhatsApp Group kelas. Setiap pendaftaran dari wali murid akan tersimpan otomatis di database cloud dan Google Sheets.
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
