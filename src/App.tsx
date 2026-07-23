import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RegistrationForm from './components/RegistrationForm';
import AdminDashboard from './components/AdminDashboard';
import { StudentRegistration, GoogleSheetConfig } from './types';
import { appendRegistrationToAppsScript } from './lib/sheets';
import { Sparkles, Trophy, FileSpreadsheet, ListTodo, ShieldCheck } from 'lucide-react';
import { doc, setDoc, collection, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function App() {
  const [tab, setTab] = useState<'form' | 'admin'>('form');
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig | null>(null);
  const [waLink, setWaLink] = useState<string>('https://chat.whatsapp.com/CgWJzVBrQ7vAZu1BSJHS8l');
  const [logoUrl, setLogoUrl] = useState<string>('');

  // 1. Initial Load & Set up Firestore Real-time Sync
  useEffect(() => {
    // Preload from localstorage for instant UI display while Firestore connects
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
    if (savedWaLink) {
      setWaLink(savedWaLink);
    }

    const savedLogo = localStorage.getItem('sdn_ulujami_logo');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }

    // A. Real-time Config sync from Firestore
    const configDocRef = doc(db, 'configs', 'main');
    const unsubscribeConfig = onSnapshot(configDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.appsScriptUrl !== undefined || data.spreadsheetUrl !== undefined) {
          const newConfig: GoogleSheetConfig = {
            appsScriptUrl: data.appsScriptUrl || '',
            spreadsheetUrl: data.spreadsheetUrl || ''
          };
          setSheetConfig(newConfig);
          localStorage.setItem('sdn_ulujami_sheet_config', JSON.stringify(newConfig));
        }
        if (data.waLink !== undefined) {
          setWaLink(data.waLink || 'https://chat.whatsapp.com/CgWJzVBrQ7vAZu1BSJHS8l');
          localStorage.setItem('sdn_ulujami_wa_link', data.waLink || 'https://chat.whatsapp.com/CgWJzVBrQ7vAZu1BSJHS8l');
        }
        if (data.logoUrl !== undefined) {
          setLogoUrl(data.logoUrl || '');
          localStorage.setItem('sdn_ulujami_logo', data.logoUrl || '');
        }
      } else {
        // Initialize config document on Firestore if it doesn't exist
        const currentConfig: GoogleSheetConfig | null = savedSheetConfig ? JSON.parse(savedSheetConfig) : null;
        setDoc(configDocRef, {
          appsScriptUrl: currentConfig?.appsScriptUrl || '',
          spreadsheetUrl: currentConfig?.spreadsheetUrl || '',
          waLink: savedWaLink || 'https://chat.whatsapp.com/CgWJzVBrQ7vAZu1BSJHS8l',
          logoUrl: savedLogo || ''
        }, { merge: true }).catch(err => console.error("Initial config set failed:", err));
      }
    }, (error) => {
      console.error("Failed to sync config from Firestore:", error);
    });

    // B. Real-time Registrations sync from Firestore
    const registrationsQuery = query(collection(db, 'registrations'), orderBy('registeredAt', 'desc'));
    const unsubscribeRegs = onSnapshot(registrationsQuery, (snapshot) => {
      const list: StudentRegistration[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as StudentRegistration);
      });
      setRegistrations(list);
      localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(list));
    }, (error) => {
      console.error("Failed to sync registrations from Firestore:", error);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeRegs();
    };
  }, []);

  // Favicon update effect
  useEffect(() => {
    if (logoUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = logoUrl;
    } else {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.removeAttribute('href');
      }
    }
  }, [logoUrl]);

  // 2. Create new student registration
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

    // Save locally first to guarantee instant UI update
    const updatedList = [newReg, ...registrations];
    setRegistrations(updatedList);
    localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(updatedList));

    // Save to Firestore in background (completely non-blocking)
    const regDocRef = doc(db, 'registrations', id);
    setDoc(regDocRef, newReg).catch((err) => {
      console.error('Failed to save registration to Firestore in background:', err);
    });

    // Attempt background sync to Google Sheets if configured
    if (sheetConfig && sheetConfig.appsScriptUrl) {
      // Run this as an asynchronous non-blocking task so the UI does not freeze
      appendRegistrationToAppsScript(sheetConfig.appsScriptUrl, newReg)
        .then(() => {
          // Sync succeeded! Update Firestore to 'synced' in the background
          const docRef = doc(db, 'registrations', id);
          setDoc(docRef, { syncStatus: 'synced', errorMessage: null }, { merge: true })
            .catch(err => console.error('Failed to update synced status in Firestore:', err));

          // Update local state and localStorage
          setRegistrations(prev => {
            const newList = prev.map(r => r.id === id ? { ...r, syncStatus: 'synced' as const, errorMessage: undefined } : r);
            localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(newList));
            return newList;
          });
        })
        .catch((err: any) => {
          console.warn('Background sync to Google Sheets failed:', err);
          // Sync failed! Update Firestore to 'failed' in the background
          const docRef = doc(db, 'registrations', id);
          setDoc(docRef, { 
            syncStatus: 'failed', 
            errorMessage: err.message || 'Gagal terhubung ke Google Sheets.' 
          }, { merge: true })
            .catch(fireErr => console.error('Failed to update failed status in Firestore:', fireErr));

          // Update local state and localStorage
          setRegistrations(prev => {
            const newList = prev.map(r => r.id === id ? { ...r, syncStatus: 'failed' as const, errorMessage: err.message || 'Gagal terhubung ke Google Sheets.' } : r);
            localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(newList));
            return newList;
          });
        });
    }

    return newReg;
  };

  // 3. Synchronize a single pending/failed registration from Admin Panel
  const syncSingleRegistration = async (reg: StudentRegistration): Promise<boolean> => {
    if (!sheetConfig || !sheetConfig.appsScriptUrl) {
      throw new Error('URL Google Apps Script belum tersambung.');
    }

    try {
      await appendRegistrationToAppsScript(sheetConfig.appsScriptUrl, reg);
      
      const updatedReg: StudentRegistration = {
        ...reg,
        syncStatus: 'synced',
        errorMessage: undefined
      };

      // Save to Firestore in background
      const regDocRef = doc(db, 'registrations', reg.id);
      setDoc(regDocRef, updatedReg).catch(err => {
        console.error('Failed to update registration status in Firestore:', err);
      });

      const updatedList = registrations.map(r => r.id === reg.id ? updatedReg : r);
      setRegistrations(updatedList);
      localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(updatedList));
      return true;
    } catch (err: any) {
      const updatedReg: StudentRegistration = {
        ...reg,
        syncStatus: 'failed',
        errorMessage: err.message
      };

      // Save to Firestore in background
      const regDocRef = doc(db, 'registrations', reg.id);
      setDoc(regDocRef, updatedReg).catch(err => {
        console.error('Failed to update registration status in Firestore:', err);
      });

      const updatedList = registrations.map(r => r.id === reg.id ? updatedReg : r);
      setRegistrations(updatedList);
      localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(updatedList));
      throw err;
    }
  };

  // 4. Update Configurations in Firestore (auto-propagates)
  const handleUpdateSheetConfig = async (config: GoogleSheetConfig | null) => {
    setSheetConfig(config);
    if (config) {
      localStorage.setItem('sdn_ulujami_sheet_config', JSON.stringify(config));
    } else {
      localStorage.removeItem('sdn_ulujami_sheet_config');
    }

    try {
      const configDocRef = doc(db, 'configs', 'main');
      await setDoc(configDocRef, {
        appsScriptUrl: config?.appsScriptUrl || '',
        spreadsheetUrl: config?.spreadsheetUrl || ''
      }, { merge: true });
    } catch (err) {
      console.error('Failed to save config to Firestore:', err);
    }
  };

  const handleUpdateWaLink = async (link: string) => {
    setWaLink(link);
    localStorage.setItem('sdn_ulujami_wa_link', link);

    try {
      const configDocRef = doc(db, 'configs', 'main');
      await setDoc(configDocRef, { waLink: link }, { merge: true });
    } catch (err) {
      console.error('Failed to save waLink to Firestore:', err);
    }
  };

  const handleUpdateLogo = async (logo: string) => {
    setLogoUrl(logo);
    if (logo) {
      localStorage.setItem('sdn_ulujami_logo', logo);
    } else {
      localStorage.removeItem('sdn_ulujami_logo');
    }

    try {
      const configDocRef = doc(db, 'configs', 'main');
      await setDoc(configDocRef, { logoUrl: logo }, { merge: true });
    } catch (err) {
      console.error('Failed to save logoUrl to Firestore:', err);
    }
  };

  // 5. Clear registrations from Local & Firestore
  const handleClearData = async () => {
    setRegistrations([]);
    localStorage.removeItem('sdn_ulujami_registrations');

    try {
      for (const reg of registrations) {
        const regDocRef = doc(db, 'registrations', reg.id);
        await deleteDoc(regDocRef);
      }
    } catch (err) {
      console.error('Failed to clear registrations from Firestore:', err);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800 flex flex-col font-sans">
      
      {/* Header component */}
      <Header 
        currentTab={tab} 
        setTab={setTab} 
        isSheetConnected={!!sheetConfig}
        spreadsheetUrl={sheetConfig?.spreadsheetUrl}
        logoUrl={logoUrl}
      />

      {/* Main Container */}
      <main className="flex-1 bg-[radial-gradient(#d1fae5_1px,transparent_1px)] [background-size:16px_16px]">
        {tab === 'form' ? (
          <div className="space-y-6">
            <RegistrationForm onRegister={handleRegister} waLink={waLink} />
          </div>
        ) : (
          <AdminDashboard 
            registrations={registrations}
            setRegistrations={setRegistrations}
            sheetConfig={sheetConfig}
            setSheetConfig={handleUpdateSheetConfig}
            onClearData={handleClearData}
            syncSingleRegistration={syncSingleRegistration}
            waLink={waLink}
            onUpdateWaLink={handleUpdateWaLink}
            logoUrl={logoUrl}
            onUpdateLogo={handleUpdateLogo}
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
