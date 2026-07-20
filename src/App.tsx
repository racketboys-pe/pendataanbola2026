import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { StudentRegistration, GoogleSheetConfig } from './types';
import { appendRegistrationToAppsScript } from './lib/sheets';
import { Sparkles, Trophy, FileSpreadsheet, ListTodo, ShieldCheck } from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState<'form' | 'admin'>('form');
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig | null>(null);
  const [waLink, setWaLink] = useState<string>('https://chat.whatsapp.com/CgWJzVBrQ7vAZu1BSJHS8l');

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const savedRegs = localStorage.getItem('sdn_ulujami_registrations');
    if (savedRegs) {
      try {
        setRegistrations(JSON.parse(savedRegs));
      } catch (err) {
        console.error('Failed to parse registrations:', err);
      }
    }

    const savedSheetConfig = localStorage.getItem('sdn_ulujami_sheet_config');
    if (savedSheetConfig) {
      try {
        setSheetConfig(JSON.parse(savedSheetConfig));
      } catch (err) {
        console.error('Failed to parse sheet config:', err);
      }
    }

    const savedWaLink = localStorage.getItem('sdn_ulujami_wa_link');
    if (savedWaLink && savedWaLink !== 'https://s.id/wa-ekskulsepakbola-ulujami06') {
      setWaLink(savedWaLink);
    } else {
      setWaLink('https://chat.whatsapp.com/CgWJzVBrQ7vAZu1BSJHS8l');
    }
  }, []);

  // 2. Persist configurations whenever they change
  useEffect(() => {
    if (sheetConfig) {
      localStorage.setItem('sdn_ulujami_sheet_config', JSON.stringify(sheetConfig));
    } else {
      localStorage.removeItem('sdn_ulujami_sheet_config');
    }
  }, [sheetConfig]);

  // 3. Create new student registration
  const handleRegister = async (
    formData: Omit<StudentRegistration, 'id' | 'registeredAt' | 'syncStatus'>
  ): Promise<StudentRegistration> => {
    // Generate unique registration ID like SB06P-4821
    const id = `SB06P-${Math.floor(1000 + Math.random() * 9000)}`;
    const registeredAt = new Date().toISOString();
    
    const newReg: StudentRegistration = {
      ...formData,
      id,
      registeredAt,
      syncStatus: 'pending'
    };

    // Attempt direct real-time sync with Google Apps Script if connected
    let updatedReg = { ...newReg };

    if (sheetConfig && sheetConfig.appsScriptUrl) {
      try {
        await appendRegistrationToAppsScript(sheetConfig.appsScriptUrl, newReg);
        updatedReg.syncStatus = 'synced';
      } catch (err: any) {
        console.warn('Real-time sync failed, leaving registration as pending:', err);
        updatedReg.syncStatus = 'failed';
        updatedReg.errorMessage = err.message || 'Sync failed';
      }
    }

    // Save locally
    const updatedList = [updatedReg, ...registrations];
    setRegistrations(updatedList);
    localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(updatedList));

    return updatedReg;
  };

  // 4. Synchronize a single pending/failed registration from Admin Panel
  const syncSingleRegistration = async (reg: StudentRegistration): Promise<boolean> => {
    if (!sheetConfig || !sheetConfig.appsScriptUrl) {
      throw new Error('URL Google Apps Script belum tersambung.');
    }

    try {
      await appendRegistrationToAppsScript(sheetConfig.appsScriptUrl, reg);
      
      const updatedList = registrations.map(r => {
        if (r.id === reg.id) {
          return { ...r, syncStatus: 'synced' as const, errorMessage: undefined };
        }
        return r;
      });
      
      setRegistrations(updatedList);
      localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(updatedList));
      return true;
    } catch (err: any) {
      const updatedList = registrations.map(r => {
        if (r.id === reg.id) {
          return { ...r, syncStatus: 'failed' as const, errorMessage: err.message };
        }
        return r;
      });
      setRegistrations(updatedList);
      localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(updatedList));
      throw err;
    }
  };

  // 6. Clear local storage records
  const handleClearData = () => {
    setRegistrations([]);
    localStorage.removeItem('sdn_ulujami_registrations');
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800 flex flex-col font-sans">
      
      {/* Header component */}
      <Header 
        currentTab={tab} 
        setTab={setTab} 
        isSheetConnected={!!sheetConfig}
        spreadsheetUrl={sheetConfig?.spreadsheetUrl}
      />

      {/* Main Container */}
      <main className="flex-1 bg-[radial-gradient(#d1fae5_1px,transparent_1px)] [background-size:16px_16px]">
        {tab === 'form' ? (
          <div className="space-y-6">
            {/* Direct Sync alert banner if connected */}
            {sheetConfig && (
              <div className="max-w-5xl mx-auto px-4 mt-6">
                <div className="flex items-center justify-between gap-3 bg-white border-2 border-emerald-100 p-4 rounded-2xl text-emerald-800 text-xs font-bold shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600 animate-pulse">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span>
                      Google Spreadsheet Aktif: Data pendaftaran akan otomatis disinkronkan langsung ke cloud.
                    </span>
                  </div>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                    Connected
                  </span>
                </div>
              </div>
            )}
            
            <RegistrationForm onRegister={handleRegister} waLink={waLink} />
          </div>
        ) : (
          <AdminDashboard 
            registrations={registrations}
            setRegistrations={setRegistrations}
            sheetConfig={sheetConfig}
            setSheetConfig={setSheetConfig}
            onClearData={handleClearData}
            syncSingleRegistration={syncSingleRegistration}
            waLink={waLink}
            onUpdateWaLink={(link) => {
              setWaLink(link);
              localStorage.setItem('sdn_ulujami_wa_link', link);
            }}
          />
        )}
      </main>

      {/* Athletic Football Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center text-xs relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 space-y-2">
          <p className="font-bold text-slate-200">
            copyright Gurumasakini &gt;&lt; SDN Ulujami 06 Pagi
          </p>
          <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
            Portal Digital Pendaftaran Ekstrakurikuler Sepakbola. Mengembangkan minat bakat olahraga usia dini sejak dini, secara sportif, mandiri, dan berprestasi.
          </p>
          <div className="flex justify-center items-center gap-4 pt-2 text-[10px] text-slate-600 font-mono font-semibold">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure Google OAuth</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Designed for Excellence</span>
          </div>
        </div>
      </footer>

      {/* Footer Decorative Stripes */}
      <footer className="h-4 bg-emerald-600 flex shrink-0">
        <div className="h-full flex-1 bg-yellow-400"></div>
        <div className="h-full flex-1 bg-emerald-600"></div>
        <div className="h-full flex-1 bg-blue-600"></div>
        <div className="h-full flex-1 bg-yellow-400"></div>
        <div className="h-full flex-1 bg-emerald-600"></div>
      </footer>

    </div>
  );
}
