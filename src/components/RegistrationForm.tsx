import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, MapPin, Calendar, Layers, ArrowUp, Activity, CheckCircle, 
  HelpCircle, Sparkles, Trophy, AlertCircle, FileText, ChevronRight, Check, ArrowUpRight
} from 'lucide-react';
import { StudentRegistration, RegistrationType } from '../types';

interface RegistrationFormProps {
  onRegister: (data: Omit<StudentRegistration, 'id' | 'registeredAt' | 'syncStatus'>) => Promise<StudentRegistration>;
  waLink: string;
}

export default function RegistrationForm({ onRegister, waLink }: RegistrationFormProps) {
  // Form fields state
  const [regType, setRegType] = useState<RegistrationType>('baru');
  const [fullName, setFullName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [classNumber, setClassNumber] = useState('1');
  const [classLetter, setClassLetter] = useState('A');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [agreed, setAgreed] = useState(false);

  // Status & UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<StudentRegistration | null>(null);

  // Field touch / dirty states for validation feedback
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Form Validations
  const errors = {
    fullName: !fullName.trim() ? 'Nama lengkap wajib diisi' : fullName.trim().length < 3 ? 'Nama minimal 3 karakter' : '',
    birthPlace: !birthPlace.trim() ? 'Tempat lahir wajib diisi' : '',
    birthDate: !birthDate ? 'Tanggal lahir wajib diisi' : '',
    height: !height ? 'Tinggi badan wajib diisi' : isNaN(Number(height)) || Number(height) < 80 || Number(height) > 200 ? 'Tinggi badan harus antara 80 cm - 200 cm' : '',
    weight: !weight ? 'Berat badan wajib diisi' : isNaN(Number(weight)) || Number(weight) < 15 || Number(weight) > 100 ? 'Berat badan harus antara 15 kg - 100 kg' : '',
    agreement: !agreed ? 'Anda harus menyetujui ketentuan ekstrakurikuler' : ''
  };

  const isFormValid = !Object.values(errors).some(err => err !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(errors).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!isFormValid) {
      setErrorMessage('Harap lengkapi semua data dengan benar sebelum mendaftar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        registrationType: regType,
        fullName: fullName.trim(),
        birthPlace: birthPlace.trim(),
        birthDate: birthDate,
        classNumber,
        classLetter: classLetter.toUpperCase(),
        height: Number(height),
        weight: Number(weight),
        agreedToTerms: agreed
      };

      const result = await onRegister(data);
      setSuccessReceipt(result);
      
      // Reset form
      setFullName('');
      setBirthPlace('');
      setBirthDate('');
      setClassNumber('1');
      setClassLetter('A');
      setHeight('');
      setWeight('');
      setAgreed(false);
      setTouched({});
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat memproses pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        {!successReceipt ? (
          <motion.div
            key="registration-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Form Formats (7 columns) */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white rounded-3xl shadow-xl border-2 border-emerald-100 overflow-hidden flex flex-col">
              {/* Form Header / Grass Accent banner */}
              <div className="bg-emerald-600 text-white px-6 py-5 relative border-b-4 border-yellow-400">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                  <Trophy className="w-16 h-16 text-white" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-xl font-black uppercase tracking-wide flex items-center gap-2">
                    <span>📝</span> Lengkapi Data Peserta
                  </h2>
                  <p className="text-xs text-emerald-100 font-bold uppercase tracking-wider mt-1">
                    Isi berkas pendaftaran dengan data akurat siswa
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                
                {/* 1. Tipe Pendaftaran Toggle */}
                <div>
                  <label className="block text-xs font-black text-emerald-600 uppercase mb-1.5 ml-1">
                    Tipe Pendaftaran
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                    <button
                      type="button"
                      onClick={() => setRegType('baru')}
                      className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                        regType === 'baru'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Pendaftaran Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegType('ulang')}
                      className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                        regType === 'ulang'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                      Daftar Ulang (Lama)
                    </button>
                  </div>
                </div>

                <div className="border-t border-emerald-100 my-4"></div>

                {/* 2. Personal Information Grid */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Identitas Lengkap Siswa
                  </h3>

                  {/* Full Name Field */}
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">
                      Nama Lengkap Siswa <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        placeholder="Contoh: Muhammad Aris"
                        className={`w-full pl-10 pr-4 py-3 bg-emerald-50 border-2 rounded-xl text-sm font-bold text-emerald-900 focus:outline-none focus:bg-white transition-all ${
                          touched.fullName && errors.fullName
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-emerald-100 focus:border-emerald-500'
                        }`}
                      />
                    </div>
                    {touched.fullName && errors.fullName && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Birthplace & Birthdate Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Birth Place */}
                    <div>
                      <label htmlFor="birthPlace" className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">
                        Tempat Lahir <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                          <MapPin className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type="text"
                          id="birthPlace"
                          value={birthPlace}
                          onChange={(e) => setBirthPlace(e.target.value)}
                          onBlur={() => handleBlur('birthPlace')}
                          placeholder="Contoh: Jakarta"
                          className={`w-full pl-10 pr-4 py-3 bg-emerald-50 border-2 rounded-xl text-sm font-bold text-emerald-900 focus:outline-none focus:bg-white transition-all ${
                            touched.birthPlace && errors.birthPlace
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-emerald-100 focus:border-emerald-500'
                          }`}
                        />
                      </div>
                      {touched.birthPlace && errors.birthPlace && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.birthPlace}
                        </p>
                      )}
                    </div>

                    {/* Birth Date */}
                    <div>
                      <label htmlFor="birthDate" className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">
                        Tanggal Lahir <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                          <Calendar className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type="date"
                          id="birthDate"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          onBlur={() => handleBlur('birthDate')}
                          className={`w-full pl-10 pr-4 py-3 bg-emerald-50 border-2 rounded-xl text-sm font-bold text-emerald-900 focus:outline-none focus:bg-white transition-all ${
                            touched.birthDate && errors.birthDate
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-emerald-100 focus:border-emerald-500'
                          }`}
                        />
                      </div>
                      {touched.birthDate && errors.birthDate && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.birthDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Class selection Row */}
                  <div>
                    <label htmlFor="classSelect" className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">
                      Pilihan Kelas <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                        <Layers className="w-4.5 h-4.5" />
                      </div>
                      <select
                        id="classSelect"
                        value={`${classNumber}${classLetter}`}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = val.charAt(0);
                          const letter = val.substring(1);
                          setClassNumber(num);
                          setClassLetter(letter);
                        }}
                        className="w-full pl-10 pr-10 py-3 bg-emerald-50 border-2 border-emerald-100 focus:border-emerald-500 focus:bg-white rounded-xl text-sm font-bold text-emerald-900 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {['1A', '1B', '2A', '2B', '3A', '3B', '3C', '4A', '4B', '5A', '5B', '6A', '6B'].map((cls) => (
                          <option key={cls} value={cls}>Kelas {cls}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-emerald-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-emerald-100 my-4"></div>

                {/* 3. Physical Attributes Grid */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Atribut Fisik Atletik
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Height */}
                    <div>
                      <label htmlFor="height" className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">
                        Tinggi Badan (cm) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                          <ArrowUp className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type="number"
                          id="height"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          onBlur={() => handleBlur('height')}
                          placeholder="140"
                          min="80"
                          max="200"
                          className={`w-full pl-10 pr-12 py-3 bg-emerald-50 border-2 rounded-xl text-sm font-bold text-emerald-900 focus:outline-none focus:bg-white transition-all ${
                            touched.height && errors.height
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-emerald-100 focus:border-emerald-500'
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-emerald-600 text-xs font-bold">
                          cm
                        </div>
                      </div>
                      {touched.height && errors.height && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.height}
                        </p>
                      )}
                    </div>

                    {/* Weight */}
                    <div>
                      <label htmlFor="weight" className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">
                        Berat Badan (kg) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                          <Activity className="w-4.5 h-4.5" />
                        </div>
                        <input
                          type="number"
                          id="weight"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          onBlur={() => handleBlur('weight')}
                          placeholder="35"
                          min="15"
                          max="100"
                          className={`w-full pl-10 pr-12 py-3 bg-emerald-50 border-2 rounded-xl text-sm font-bold text-emerald-900 focus:outline-none focus:bg-white transition-all ${
                            touched.weight && errors.weight
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-emerald-100 focus:border-emerald-500'
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-emerald-600 text-xs font-bold">
                          kg
                        </div>
                      </div>
                      {touched.weight && errors.weight && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.weight}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-emerald-100 my-4"></div>

                {/* 4. Terms and Agreement */}
                <div className="col-span-2 mt-4 p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex flex-col gap-3">
                  <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    Ketentuan Ekstrakurikuler Sepak Bola
                  </h4>
                  <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside font-medium leading-relaxed">
                    <li>Peserta wajib mengikuti seluruh jadwal latihan secara disiplin dan tepat waktu.</li>
                    <li>Siswa bersedia mengenakan kaos olahraga serta sepatu bola yang aman saat berlatih.</li>
                    <li>Peserta bersedia menjaga nama baik sekolah SDN Ulujami 06 Pagi dengan bersikap sportif.</li>
                  </ul>

                  <div className="pt-2 border-t border-emerald-200/50">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        onBlur={() => handleBlur('agreement')}
                        className="mt-1 w-5 h-5 accent-emerald-600 rounded-md border-emerald-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-emerald-800 select-none group-hover:text-emerald-950 leading-tight">
                        Saya bersedia mengikuti seluruh ketentuan ekstrakurikuler Sepak Bola dan data yang saya berikan adalah benar. <span className="text-red-500">*</span>
                      </span>
                    </label>
                    {touched.agreement && errors.agreement && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.agreement}
                      </p>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-4 bg-red-50 border-2 border-red-100 text-red-800 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="text-xs font-black uppercase tracking-wide">{errorMessage}</div>
                  </div>
                )}

                {/* Action button */}
                <div className="col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl text-xl shadow-lg transform active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Memproses Berkas...
                      </>
                    ) : (
                      <>
                        Simpan Pendaftaran
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>

            {/* Right Column: Information/Guide (5 columns) */}
            <aside className="lg:col-span-5 flex flex-col gap-6">
              {/* WhatsApp Group Quick Access Card */}
              <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-100 shadow-lg flex flex-col gap-3.5 relative overflow-hidden animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center text-xl shrink-0 shadow-md">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.588 1.976 14.111 1.01 11.493 1.01c-5.442 0-9.866 4.372-9.87 9.802 0 1.764.485 3.487 1.402 5.013l-.997 3.64 3.754-.973zm11.534-7.312c-.301-.15-.1784-.1764-1.21-.692-.12-.06-.207-.09-.301.05-.09.14-.35.44-.43.53-.08.09-.16.1-.301.03-.14-.07-.591-.216-1.125-.692-.415-.371-.695-.83-.776-.971-.08-.14-.01-.22.06-.29.06-.06.14-.17.21-.25.08-.08.11-.14.16-.24.05-.1.03-.19-.01-.27-.04-.08-.301-.73-.413-1-.11-.27-.22-.23-.301-.23h-.25c-.09 0-.24.03-.36.17-.13.14-.49.48-.49 1.18s.51 1.38.58 1.48c.07.1 1.01 1.543 2.45 2.165.34.15.61.24.82.3.34.11.66.09.91.06.28-.04.86-.35 1.01-.69.15-.34.15-.63.1-.69-.05-.06-.17-.09-.32-.17z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-emerald-950 font-black uppercase tracking-wide text-xs">Grup WhatsApp Resmi</h4>
                    <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Pemberitahuan &amp; Koordinasi</p>
                  </div>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed font-bold">
                  Silakan bergabung ke grup WA untuk koordinasi waktu dan lokasi latihan secara berkala.
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white text-center font-black py-3 rounded-2xl text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm border border-[#128C7E]/20"
                >
                  GABUNG GRUP WHATSAPP
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Vibrant Blue Information Card */}
              <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl flex-1 relative overflow-hidden flex flex-col justify-between border border-blue-500 min-h-[300px]">
                {/* Decorative soccer ball graphic in bottom-right */}
                <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
                  <svg width="200" height="200" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <circle cx="12" cy="12" r="5"/>
                  </svg>
                </div>

                <div className="relative z-10 space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Informasi Latihan</h3>
                  
                  <ul className="space-y-4 pt-2">
                    <li className="flex gap-4 items-center">
                      <span className="bg-white/20 p-2.5 rounded-xl text-lg flex items-center justify-center w-10 h-10 shrink-0">📅</span>
                      <div>
                        <p className="text-blue-100 text-xs font-black uppercase tracking-wider">Jadwal</p>
                        <p className="font-black text-sm">Setiap Hari Kamis</p>
                      </div>
                    </li>
                    <li className="flex gap-4 items-center">
                      <span className="bg-white/20 p-2.5 rounded-xl text-lg flex items-center justify-center w-10 h-10 shrink-0">🕒</span>
                      <div>
                        <p className="text-blue-100 text-xs font-black uppercase tracking-wider">Waktu</p>
                        <p className="font-black text-sm">Diumumkan di Grup WA</p>
                      </div>
                    </li>
                    <li className="flex gap-4 items-center">
                      <span className="bg-white/20 p-2.5 rounded-xl text-lg flex items-center justify-center w-10 h-10 shrink-0">📍</span>
                      <div>
                        <p className="text-blue-100 text-xs font-black uppercase tracking-wider">Lokasi</p>
                        <p className="font-black text-sm">Diumumkan di Grup WA</p>
                      </div>
                    </li>
                  </ul>
                </div>

              </div>
            </aside>
          </motion.div>
        ) : (
          /* SUCCESS STATE / PRINTABLE RECEIPT CARD */
          <motion.div
            key="success-receipt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden"
          >
            {/* Header Success Banner */}
            <div className="bg-emerald-600 text-white text-center p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/50 via-transparent to-transparent pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white/15 border border-white/20 flex items-center justify-center mb-4 text-yellow-300">
                  <CheckCircle className="w-10 h-10 drop-shadow-md" />
                </div>
                <span className="px-2.5 py-0.5 bg-yellow-400 text-emerald-950 font-black text-[9px] tracking-widest rounded-full uppercase">
                  Pendaftaran Sukses
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">Bukti Registrasi Digital</h2>
                <p className="text-xs text-emerald-100/95 mt-1">
                  SDN Ulujami 06 Pagi — Tim Ekstrakurikuler Sepakbola
                </p>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">
                    ID PENDAFTARAN
                  </span>
                  <p className="text-sm font-black text-gray-800 font-mono">
                    {successReceipt.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">
                    STATUS SHEET
                  </span>
                  <div>
                    {successReceipt.syncStatus === 'synced' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        <Check className="w-3 h-3" /> Terparkir (Synced)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold" title="Data disimpan di penyimpanan lokal, admin akan mensinkronisasikan ke Google Sheets.">
                        Disimpan Lokal (Pending)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Bio */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                  Detail Anggota Baru
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-t border-gray-100 pt-3">
                  <div>
                    <span className="text-gray-400 font-medium">Tipe Formulir</span>
                    <p className="font-bold text-emerald-700 mt-0.5">
                      {successReceipt.registrationType === 'baru' ? 'Pendaftaran Baru' : 'Daftar Ulang'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Kelas Siswa</span>
                    <p className="font-bold text-gray-800 mt-0.5">
                      Kelas {successReceipt.classNumber} - {successReceipt.classLetter}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 border-t border-gray-100 pt-3.5">
                  <span className="text-xs text-gray-400 font-medium">Nama Lengkap Siswa</span>
                  <p className="text-base font-black text-gray-900 mt-0.5 uppercase">
                    {successReceipt.fullName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm border-t border-gray-100 pt-3.5">
                  <div>
                    <span className="text-gray-400 font-medium">Tempat, Tgl Lahir</span>
                    <p className="font-bold text-gray-800 mt-0.5">
                      {successReceipt.birthPlace}, {successReceipt.birthDate}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Tinggi &amp; Berat</span>
                    <p className="font-bold text-gray-800 mt-0.5">
                      {successReceipt.height} cm / {successReceipt.weight} kg
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3.5 text-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-500/5">
                  <p className="text-[11px] text-emerald-800 font-semibold leading-relaxed">
                    ✓ Orang tua telah menyetujui seluruh ketentuan Ekstrakurikuler Sepak Bola SDN Ulujami 06 Pagi secara sah dan digital.
                  </p>
                </div>
              </div>

              {/* Action Close & WA Button */}
              <div className="flex flex-col gap-3 pt-2">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-4 rounded-2xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.588 1.976 14.111 1.01 11.493 1.01c-5.442 0-9.866 4.372-9.87 9.802 0 1.764.485 3.487 1.402 5.013l-.997 3.64 3.754-.973zm11.534-7.312c-.301-.15-.1784-.1764-1.21-.692-.12-.06-.207-.09-.301.05-.09.14-.35.44-.43.53-.08.09-.16.1-.301.03-.14-.07-.591-.216-1.125-.692-.415-.371-.695-.83-.776-.971-.08-.14-.01-.22.06-.29.06-.06.14-.17.21-.25.08-.08.11-.14.16-.24.05-.1.03-.19-.01-.27-.04-.08-.301-.73-.413-1-.11-.27-.22-.23-.301-.23h-.25c-.09 0-.24.03-.36.17-.13.14-.49.48-.49 1.18s.51 1.38.58 1.48c.07.1 1.01 1.543 2.45 2.165.34.15.61.24.82.3.34.11.66.09.91.06.28-.04.86-.35 1.01-.69.15-.34.15-.63.1-.69-.05-.06-.17-.09-.32-.17z" />
                  </svg>
                  GABUNG GRUP WHATSAPP RESMI
                </a>
                <button
                  type="button"
                  onClick={() => setSuccessReceipt(null)}
                  className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Daftarkan Peserta Lainnya
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
