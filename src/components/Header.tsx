import React from 'react';
import { Trophy, Shield, Settings, FileSpreadsheet, UserCheck, Sparkles, Share2 } from 'lucide-react';

interface HeaderProps {
  currentTab: 'form' | 'admin';
  setTab: (tab: 'form' | 'admin') => void;
  isSheetConnected: boolean;
  spreadsheetUrl?: string;
  logoUrl?: string;
  onOpenShareModal?: () => void;
}

export default function Header({ currentTab, setTab, isSheetConnected, spreadsheetUrl, logoUrl, onOpenShareModal }: HeaderProps) {
  return (
    <header className="relative overflow-hidden bg-emerald-600 text-white shadow-lg border-b-4 border-yellow-400">
      {/* Decorative background soccer pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white rounded-full"></div>
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo & School Title */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner shrink-0 ring-4 ring-emerald-500/30 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="School Logo" className="w-full h-full object-cover" />
              ) : (
                <Trophy className="w-10 h-10 text-emerald-700" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-black bg-yellow-400 text-emerald-900 rounded-full tracking-wider uppercase">
                  STATUS: DIBUKA
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-100 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Ekskul Sepakbola
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 uppercase">
                SDN Ulujami 06 Pagi
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 font-bold uppercase tracking-widest">
                Formulir Pendaftaran &amp; Daftar Ulang
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setTab('form')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-md transform active:scale-95 ${
                currentTab === 'form'
                  ? 'bg-yellow-400 text-emerald-950 hover:bg-yellow-300 ring-2 ring-yellow-300'
                  : 'bg-emerald-700/60 hover:bg-emerald-700 text-emerald-50 border border-emerald-500/30'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Pendaftaran Siswa
            </button>

            <button
              onClick={() => setTab('admin')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-md transform active:scale-95 ${
                currentTab === 'admin'
                  ? 'bg-yellow-400 text-emerald-950 hover:bg-yellow-300 ring-2 ring-yellow-300'
                  : 'bg-emerald-700/60 hover:bg-emerald-700 text-emerald-50 border border-emerald-500/30'
              }`}
            >
              <Settings className="w-4 h-4" />
              Operator (Admin)
            </button>

            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 border border-yellow-300/50 text-yellow-300 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md transform active:scale-95"
                title="Bagikan Link Pendaftaran Publik"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan Link</span>
              </button>
            )}

            {/* Google Sheets Connection Badge - Only visible on Admin Tab */}
            {currentTab === 'admin' && isSheetConnected && spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-colors duration-300"
                title="Buka Google Spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-yellow-300" />
                Spreadsheet
              </a>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
