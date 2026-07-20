import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, ShieldAlert, CheckCircle, RefreshCw, Trash2, 
  Download, Search, Filter, Database, Link, AlertCircle, ArrowUpRight, 
  Activity, Users, UserCheck, Calendar, Sparkles, Check, LogOut, ArrowRight,
  Lock, Key, ShieldCheck
} from 'lucide-react';
import { StudentRegistration, GoogleSheetConfig } from '../types';
import { googleSignIn, logout } from '../lib/firebase';
import { createRegistrationSpreadsheet, appendRegistrationToSheet } from '../lib/sheets';

interface AdminDashboardProps {
  registrations: StudentRegistration[];
  setRegistrations: React.Dispatch<React.SetStateAction<StudentRegistration[]>>;
  sheetConfig: GoogleSheetConfig | null;
  setSheetConfig: (config: GoogleSheetConfig | null) => void;
  onClearData: () => void;
  syncSingleRegistration: (reg: StudentRegistration) => Promise<boolean>;
  waLink: string;
  onUpdateWaLink: (link: string) => void;
}

export default function AdminDashboard({
  registrations,
  setRegistrations,
  sheetConfig,
  setSheetConfig,
  onClearData,
  syncSingleRegistration,
  waLink,
  onUpdateWaLink
}: AdminDashboardProps) {
  // Local Session Admin Auth
  const [isLocalAuthorized, setIsLocalAuthorized] = useState(() => {
    return sessionStorage.getItem('sdn_ulujami_admin_logged') === 'true';
  });
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Local Admin Password Settings
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');

  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState('');
  const [isLinkingCustom, setIsLinkingCustom] = useState(false);

  // Helper to fetch the stored local admin password (defaults to 'admin')
  const getAdminPassword = () => {
    return localStorage.getItem('sdn_ulujami_admin_password') || 'admin';
  };

  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = getAdminPassword();
    if (loginId.trim() === 'admin' && loginPass === correctPassword) {
      setIsLocalAuthorized(true);
      sessionStorage.setItem('sdn_ulujami_admin_logged', 'true');
      setLoginError('');
      setLoginId('');
      setLoginPass('');
    } else {
      setLoginError('ID Admin atau Password salah. Silakan coba lagi.');
    }
  };

  const handleLocalLogout = () => {
    setIsLocalAuthorized(false);
    sessionStorage.removeItem('sdn_ulujami_admin_logged');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPass = getAdminPassword();
    if (oldPasswordInput !== currentPass) {
      setChangePassError('Password lama tidak sesuai.');
      setChangePassSuccess('');
      return;
    }
    if (newPasswordInput.length < 4) {
      setChangePassError('Password baru minimal 4 karakter.');
      setChangePassSuccess('');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePassError('Konfirmasi password baru tidak cocok.');
      setChangePassSuccess('');
      return;
    }

    localStorage.setItem('sdn_ulujami_admin_password', newPasswordInput);
    setChangePassSuccess('Password admin berhasil diperbarui!');
    setChangePassError('');
    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSync, setFilterSync] = useState<string>('all');

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoadingAuth(true);
    setSyncLogs(prev => [...prev, 'Memulai login dengan Google...']);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setSyncLogs(prev => [...prev, `Berhasil login sebagai: ${res.user.displayName || res.user.email}`]);
      }
    } catch (err: any) {
      console.error(err);
      setSyncLogs(prev => [...prev, `Gagal login: ${err.message || 'Error tidak diketahui'}`]);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setSyncLogs(prev => [...prev, 'Keluar dari Google.']);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Create Spreadsheet
  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      alert('Harap login dengan Google terlebih dahulu.');
      return;
    }
    
    setIsSyncingAll(true);
    setSyncLogs(prev => [...prev, 'Membuat Google Spreadsheet baru...']);
    try {
      const config = await createRegistrationSpreadsheet(accessToken);
      setSheetConfig(config);
      setSyncLogs(prev => [...prev, `Sukses membuat spreadsheet: "${config.title}"`]);
    } catch (err: any) {
      console.error(err);
      setSyncLogs(prev => [...prev, `Gagal membuat spreadsheet: ${err.message}`]);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Link Custom Sheet ID
  const handleLinkCustomSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSpreadsheetId.trim()) return;

    let id = customSpreadsheetId.trim();
    // Support picking ID out of full URL
    if (id.includes('docs.google.com/spreadsheets')) {
      const matches = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (matches && matches[1]) {
        id = matches[1];
      }
    }

    const config: GoogleSheetConfig = {
      spreadsheetId: id,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
      title: 'Spreadsheet Tersambung Kustom'
    };
    
    setSheetConfig(config);
    setCustomSpreadsheetId('');
    setIsLinkingCustom(false);
    setSyncLogs(prev => [...prev, `Menghubungkan ke Spreadsheet ID: ${id}`]);
  };

  // Bulk Synchronize Pending Registrations
  const handleSyncAll = async () => {
    if (!accessToken || !sheetConfig) {
      alert('Hubungkan akun Google dan Spreadsheet terlebih dahulu untuk sinkronisasi.');
      return;
    }

    const pending = registrations.filter(r => r.syncStatus !== 'synced');
    if (pending.length === 0) {
      alert('Tidak ada data pendaftaran pending yang perlu disinkronkan.');
      return;
    }

    setIsSyncingAll(true);
    setSyncLogs(prev => [...prev, `Memulai sinkronisasi massal (${pending.length} data pendaftaran)...`]);

    const updated = [...registrations];
    let successCount = 0;

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].syncStatus !== 'synced') {
        try {
          setSyncLogs(prev => [...prev, `Menyinkronkan data: ${updated[i].fullName}...`]);
          await appendRegistrationToSheet(sheetConfig.spreadsheetId, updated[i], accessToken);
          updated[i].syncStatus = 'synced';
          successCount++;
        } catch (err: any) {
          console.error(err);
          updated[i].syncStatus = 'failed';
          updated[i].errorMessage = err.message || 'Gagal sinkronisasi';
          setSyncLogs(prev => [...prev, `✗ Gagal menyinkronkan ${updated[i].fullName}: ${err.message}`]);
        }
      }
    }

    setRegistrations(updated);
    localStorage.setItem('sdn_ulujami_registrations', JSON.stringify(updated));
    setSyncLogs(prev => [...prev, `Selesai sinkronisasi. Sukses: ${successCount}, Gagal: ${pending.length - successCount}`]);
    setIsSyncingAll(false);
  };

  // Clear data locally with popup confirmation (Mandatory)
  const handleClearLocalData = () => {
    const confirmation = window.confirm(
      'Apakah Anda benar-benar yakin ingin menghapus seluruh data pendaftaran siswa di komputer/tablet ini secara permanen?\n\nTindakan ini tidak dapat dibatalkan.'
    );
    if (confirmation) {
      onClearData();
      setSyncLogs(prev => [...prev, 'Seluruh data lokal berhasil dibersihkan.']);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (registrations.length === 0) {
      alert('Tidak ada data yang bisa diekspor.');
      return;
    }

    const headers = ['Waktu Daftar', 'ID Pendaftaran', 'Tipe Pendaftaran', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir', 'Kelas', 'Tinggi (cm)', 'Berat (kg)', 'Status Sync'];
    const rows = registrations.map(r => [
      r.registeredAt,
      r.id,
      r.registrationType === 'baru' ? 'Pendaftaran Baru' : 'Daftar Ulang',
      `"${r.fullName.replace(/"/g, '""')}"`,
      r.birthPlace,
      r.birthDate,
      `${r.classNumber}-${r.classLetter}`,
      r.height,
      r.weight,
      r.syncStatus
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Pendaftaran_Ekskul_Sepakbola_SDN_Ulujami_06_Pagi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering registrations
  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' ? true : r.registrationType === filterType;
    const matchesClass = filterClass === 'all' ? true : r.classNumber === filterClass;
    const matchesSync = filterSync === 'all' ? true : r.syncStatus === filterSync;

    return matchesSearch && matchesType && matchesClass && matchesSync;
  });

  // Calculate statistics
  const totalCount = registrations.length;
  const newRegCount = registrations.filter(r => r.registrationType === 'baru').length;
  const reRegCount = registrations.filter(r => r.registrationType === 'ulang').length;
  const syncedCount = registrations.filter(r => r.syncStatus === 'synced').length;
  const pendingCount = registrations.filter(r => r.syncStatus !== 'synced').length;

  const averageHeight = totalCount > 0 
    ? Math.round(registrations.reduce((acc, r) => acc + r.height, 0) / totalCount)
    : 0;

  const averageWeight = totalCount > 0 
    ? Math.round(registrations.reduce((acc, r) => acc + r.weight, 0) / totalCount)
    : 0;

  // Distribution by class for simple visualization
  const classStats = [1, 2, 3, 4, 5, 6].map(num => {
    const count = registrations.filter(r => Number(r.classNumber) === num).length;
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return { classNum: num, count, percentage };
  });

  if (!isLocalAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 ring-4 ring-emerald-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Login Operator (Admin)</h2>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              SDN ULUJAMI 06 PAGI
            </p>
          </div>

          <form onSubmit={handleLocalLogin} className="space-y-4">
            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-bold flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-wider ml-1">
                ID Admin
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <UserCheck className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Masukkan ID admin"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-50/70 focus:bg-white border-2 border-emerald-50 focus:border-emerald-500 rounded-2xl text-xs font-bold text-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <Key className="w-4.5 h-4.5" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-50/70 focus:bg-white border-2 border-emerald-50 focus:border-emerald-500 rounded-2xl text-xs font-bold text-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-xs transition-colors shadow-lg shadow-emerald-600/10 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              MASUK SISTEM
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-[9px] font-black text-gray-300 tracking-wider uppercase">
              copyright Gurumasakini &gt;&lt; SDN Ulujami 06 Pagi
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-emerald-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Operator Console</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sesi aktif: Admin</p>
          </div>
        </div>
        <button
          onClick={handleLocalLogout}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4" /> Keluar Sesi Admin
        </button>
      </div>

      {/* 1. Statistics Cards Block */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Registrants */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">
              Total Pendaftar
            </span>
            <p className="text-2xl sm:text-3xl font-black text-gray-800 mt-1">{totalCount}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                {newRegCount} Baru
              </span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                {reRegCount} Ulang
              </span>
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Sync Status Progress */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">
              Sinkronisasi Sheets
            </span>
            <p className="text-2xl sm:text-3xl font-black text-gray-800 mt-1">{syncedCount} / {totalCount}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingCount} Pending Sync
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  Semua Ter-sync
                </span>
              )}
            </div>
          </div>
          <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Height Stat */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">
              Rata-rata Tinggi
            </span>
            <p className="text-2xl sm:text-3xl font-black text-gray-800 mt-1">{averageHeight} <span className="text-sm font-bold text-gray-400">cm</span></p>
            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Ideal untuk fisik pesepakbola</p>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-500">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Weight Stat */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">
              Rata-rata Berat
            </span>
            <p className="text-2xl sm:text-3xl font-black text-gray-800 mt-1">{averageWeight} <span className="text-sm font-bold text-gray-400">kg</span></p>
            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Kondisi ketahanan siswa</p>
          </div>
          <div className="p-3.5 bg-rose-50 rounded-xl text-rose-500">
            <Activity className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 2. Google Setup & Cloud Sync Module */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Google Credentials Controller */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-500/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Koneksi Google Spreadsheet</h3>
              <p className="text-xs text-gray-400 font-medium">Sambungkan sistem pendaftaran ke spreadsheet sekolah</p>
            </div>
          </div>

          {!user ? (
            /* Auth Login Step Required */
            <div className="py-4 space-y-4">
              <div className="p-4 bg-amber-50/50 border border-amber-500/15 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600 leading-relaxed font-medium">
                  <strong>Akun Operator Belum Terhubung:</strong> Silakan masuk dengan akun Google Operator/Sekolah untuk mengizinkan aplikasi ini membuat dan mengisi file Google Spreadsheet secara otomatis di Google Drive Anda.
                </div>
              </div>

              {/* Styled Official-like Google button */}
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoadingAuth}
                  className="flex items-center gap-3 px-5 py-3.5 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Sign in dengan Google Operator</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged In Status */
            <div className="space-y-6">
              
              {/* Operator Info card */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <img 
                    src={user.photoURL || 'https://via.placeholder.com/40'} 
                    alt="avatar" 
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full ring-2 ring-emerald-500"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{user.displayName || 'Operator Sekolah'}</h4>
                    <p className="text-[11px] text-gray-400 font-mono">{user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>

              {/* Spreadsheet Config Block */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                
                {sheetConfig ? (
                  /* Linked sheet details */
                  <div className="p-5 bg-emerald-50/50 border border-emerald-500/20 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                          Spreadsheet Terkoneksi Aktif
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSheetConfig(null)}
                        className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Putuskan Koneksi
                      </button>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-800">{sheetConfig.title}</p>
                      <p className="text-[10px] text-gray-400 font-mono select-all mt-0.5" title="Copy Spreadsheet ID">
                        ID: {sheetConfig.spreadsheetId}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-1.5">
                      <a
                        href={sheetConfig.spreadsheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-colors shadow-sm"
                      >
                        Buka di Google Sheets
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={handleSyncAll}
                        disabled={isSyncingAll || pendingCount === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                        Sinkronkan Data Pending ({pendingCount})
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Setup Spreadsheet Options */
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs text-gray-500 leading-relaxed font-medium mb-4">
                        Sistem Anda siap dihubungkan dengan Google Sheets. Silakan pilih salah satu opsi di bawah untuk mengintegrasikan data registrasi siswa:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: Create New Spreadsheet */}
                        <button
                          type="button"
                          onClick={handleCreateNewSheet}
                          disabled={isSyncingAll}
                          className="p-4 bg-white hover:bg-emerald-50/20 border border-slate-200 hover:border-emerald-500/50 rounded-xl text-left transition-all group flex flex-col justify-between h-32 cursor-pointer shadow-sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-gray-800">Buat Baru Otomatis</h5>
                            <p className="text-[10px] text-gray-400 mt-0.5">Membuat spreadsheet instan di Drive Anda</p>
                          </div>
                        </button>

                        {/* Option 2: Link Custom Sheet */}
                        <button
                          type="button"
                          onClick={() => setIsLinkingCustom(true)}
                          className="p-4 bg-white hover:bg-emerald-50/20 border border-slate-200 hover:border-emerald-500/50 rounded-xl text-left transition-all group flex flex-col justify-between h-32 cursor-pointer shadow-sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                            <Link className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-gray-800">Sambungkan Manual</h5>
                            <p className="text-[10px] text-gray-400 mt-0.5">Masukkan ID Spreadsheet yang sudah ada</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Linking Input popup / expander */}
                    {isLinkingCustom && (
                      <form onSubmit={handleLinkCustomSheet} className="p-4 border border-amber-500/20 bg-amber-50/10 rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-gray-700">Masukkan ID Spreadsheet atau URL lengkap</h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Contoh: 1v4m86_FLa... atau URL penuh"
                            value={customSpreadsheetId}
                            onChange={(e) => setCustomSpreadsheetId(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                          />
                          <button
                            type="submit"
                            className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Sambungkan
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsLinkingCustom(false)}
                            className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    )}

                  </div>
                )}

              </div>
            </div>
          )}

          {/* WhatsApp Group Configuration Card */}
          <div className="border-t border-gray-100 pt-6 mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.588 1.976 14.111 1.01 11.493 1.01c-5.442 0-9.866 4.372-9.87 9.802 0 1.764.485 3.487 1.402 5.013l-.997 3.64 3.754-.973zm11.534-7.312c-.301-.15-.1784-.1764-1.21-.692-.12-.06-.207-.09-.301.05-.09.14-.35.44-.43.53-.08.09-.16.1-.301.03-.14-.07-.591-.216-1.125-.692-.415-.371-.695-.83-.776-.971-.08-.14-.01-.22.06-.29.06-.06.14-.17.21-.25.08-.08.11-.14.16-.24.05-.1.03-.19-.01-.27-.04-.08-.301-.73-.413-1-.11-.27-.22-.23-.301-.23h-.25c-.09 0-.24.03-.36.17-.13.14-.49.48-.49 1.18s.51 1.38.58 1.48c.07.1 1.01 1.543 2.45 2.165.34.15.61.24.82.3.34.11.66.09.91.06.28-.04.86-.35 1.01-.69.15-.34.15-.63.1-.69-.05-.06-.17-.09-.32-.17z" />
                </svg>
              </div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Pengaturan Link WhatsApp Group
              </h4>
            </div>
            
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 animate-fade-in">
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                Masukkan tautan shortlink s.id (atau URL WhatsApp resmi) yang akan ditampilkan kepada pendaftar setelah sukses melakukan registrasi.
              </p>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="Masukkan link s.id grup WA (misal: https://s.id/your-link)"
                  value={waLink}
                  onChange={(e) => onUpdateWaLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 focus:border-emerald-500 rounded-lg outline-none font-medium"
                />
                <div className="px-3 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg flex items-center justify-center border border-emerald-100 uppercase shrink-0">
                  Aktif
                </div>
              </div>
            </div>
          </div>

          {/* Admin Password Configuration Card */}
          <div className="border-t border-gray-100 pt-6 mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Ganti Password Admin
                </h4>
              </div>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 animate-fade-in">
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                Ubah password login operator/admin agar tetap aman dan terkendali.
              </p>

              {changePassError && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{changePassError}</span>
                </div>
              )}

              {changePassSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-[10px] font-bold flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{changePassSuccess}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block ml-0.5">Password Lama</label>
                  <input
                    type="password"
                    required
                    placeholder="Password Lama"
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 focus:border-emerald-500 rounded-lg outline-none font-medium"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block ml-0.5">Password Baru</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 karakter"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 focus:border-emerald-500 rounded-lg outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block ml-0.5">Ulangi Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Ulangi baru"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 focus:border-emerald-500 rounded-lg outline-none font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2 rounded-xl transition-colors shadow-sm cursor-pointer uppercase tracking-wider"
              >
                Simpan Password Baru
              </button>
            </form>
          </div>

        </div>

        {/* Right Sync Activity Logs */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col h-[340px] lg:h-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider mb-3">
            Aktivitas &amp; Log Sinkronisasi
          </h3>
          <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-300 font-mono text-[10px] p-4 rounded-2xl space-y-2 border border-slate-800 shadow-inner">
            {syncLogs.length === 0 ? (
              <p className="text-slate-500 italic">Belum ada aktivitas sinkronisasi yang tercatat...</p>
            ) : (
              syncLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed border-b border-slate-800/50 pb-1 last:border-0">
                  <span className="text-emerald-500 font-bold">&gt;</span> {log}
                </div>
              ))
            )}
          </div>
          <div className="pt-3 flex justify-between items-center text-[10px] text-gray-400 font-semibold font-mono">
            <span>SDN Ulujami 06 Pagi Database Log</span>
            <button
              onClick={() => setSyncLogs([])}
              className="text-emerald-600 hover:underline cursor-pointer"
            >
              Clear Log
            </button>
          </div>
        </div>

      </div>

      {/* 3. Registrant Database List & Filtering Table */}
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
        
        {/* Table Filters Header block */}
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-800">Database Siswa Terdaftar</h3>
              <p className="text-xs text-gray-400 font-medium">Cari, filter, dan unduh data pendaftaran siswa</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Ekspor ke CSV
              </button>

              <button
                type="button"
                onClick={handleClearLocalData}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Bersihkan Data Lokal
              </button>
            </div>
          </div>

          {/* Filtering controls bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari siswa / ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-emerald-500 rounded-xl text-xs font-medium outline-none transition-all"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-200 rounded-xl px-2.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-transparent outline-none text-xs font-medium py-2 appearance-none cursor-pointer"
              >
                <option value="all">Semua Tipe Form</option>
                <option value="baru">Pendaftaran Baru</option>
                <option value="ulang">Daftar Ulang</option>
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-200 rounded-xl px-2.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full bg-transparent outline-none text-xs font-medium py-2 appearance-none cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                <option value="1">Kelas 1</option>
                <option value="2">Kelas 2</option>
                <option value="3">Kelas 3</option>
                <option value="4">Kelas 4</option>
                <option value="5">Kelas 5</option>
                <option value="6">Kelas 6</option>
              </select>
            </div>

            {/* Sync Filter */}
            <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-200 rounded-xl px-2.5">
              <Database className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filterSync}
                onChange={(e) => setFilterSync(e.target.value)}
                className="w-full bg-transparent outline-none text-xs font-medium py-2 appearance-none cursor-pointer"
              >
                <option value="all">Semua Status Sync</option>
                <option value="synced">Synced (Terparkir)</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

          </div>
        </div>

        {/* Interactive Responsive Table */}
        <div className="overflow-x-auto">
          {filteredRegistrations.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-medium space-y-2">
              <ShieldAlert className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-xs">Tidak menemukan data pendaftaran siswa yang sesuai.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">ID / Tgl Daftar</th>
                  <th className="py-4 px-6">Nama Lengkap</th>
                  <th className="py-4 px-6">Kelas</th>
                  <th className="py-4 px-6">Tempat, Tgl Lahir</th>
                  <th className="py-4 px-6">Fisik (cm/kg)</th>
                  <th className="py-4 px-6 text-center">Tipe</th>
                  <th className="py-4 px-6 text-center">Status Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 whitespace-nowrap">
                      <p className="font-bold font-mono text-gray-900">{reg.id}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {new Date(reg.registeredAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="py-3 px-6 font-bold text-gray-800 uppercase max-w-[200px] truncate">
                      {reg.fullName}
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-gray-800 rounded-lg text-[11px] font-bold">
                        Kelas {reg.classNumber}-{reg.classLetter}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-gray-600">
                      {reg.birthPlace}, {reg.birthDate}
                    </td>
                    <td className="py-3 px-6 font-mono text-gray-600">
                      {reg.height} cm / {reg.weight} kg
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      {reg.registrationType === 'baru' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                          Baru
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                          Daftar Ulang
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {reg.syncStatus === 'synced' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                            <Check className="w-3 h-3" /> Synced
                          </span>
                        ) : reg.syncStatus === 'failed' ? (
                          <button
                            onClick={async () => {
                              try {
                                await syncSingleRegistration(reg);
                              } catch (e: any) {
                                alert(`Gagal sync: ${e.message}`);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full text-[10px] font-bold transition-colors cursor-pointer"
                            title={`Klik untuk mencoba kembali. Error: ${reg.errorMessage || ''}`}
                          >
                            <AlertCircle className="w-3 h-3" /> Failed
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                await syncSingleRegistration(reg);
                              } catch (e: any) {
                                alert(`Gagal sync: ${e.message}`);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold transition-colors cursor-pointer"
                            title="Klik untuk menyinkronkan langsung ke Sheet"
                          >
                            <RefreshCw className="w-3 h-3" /> Pending
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info counts */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 font-semibold font-mono gap-2">
          <span>Menampilkan {filteredRegistrations.length} dari {totalCount} total pendaftar</span>
          <span className="text-emerald-600">✓ Sistem Database SDN Ulujami 06 Pagi</span>
        </div>

      </div>

    </div>
  );
}
