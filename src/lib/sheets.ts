import { StudentRegistration } from '../types';

/**
 * Sends student registration details to the configured Google Apps Script Web App.
 */
export async function appendRegistrationToAppsScript(
  appsScriptUrl: string,
  registration: StudentRegistration
): Promise<boolean> {
  try {
    const payload = {
      registeredAt: registration.registeredAt,
      id: registration.id,
      registrationType: registration.registrationType,
      fullName: registration.fullName,
      birthPlace: registration.birthPlace,
      birthDate: registration.birthDate,
      classNumber: registration.classNumber,
      classLetter: registration.classLetter,
      height: registration.height,
      weight: registration.weight,
      agreedToTerms: registration.agreedToTerms
    };

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // In case Google Apps Script returns some plain text / redirect
      if (text.toLowerCase().includes('error') || text.toLowerCase().includes('fail')) {
        throw new Error(text || 'Google Apps Script mengembalikan error');
      }
      return true;
    }

    if (data && data.status === 'error') {
      throw new Error(data.message || 'Gagal menyimpan ke Google Sheets via Apps Script');
    }

    return true;
  } catch (err: any) {
    console.error('Apps Script Sync Error:', err);
    throw new Error(err.message || 'Gagal terhubung ke Google Apps Script. Pastikan URL benar dan Deploy sebagai "Anyone".');
  }
}

/**
 * Validates if the Apps Script URL is in a valid format.
 */
export function validateAppsScriptUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('https://script.google.com/macros/s/') && trimmed.includes('/exec');
}

/**
 * Generates the clean Google Apps Script code for users to copy.
 */
export function getAppsScriptCodeTemplate(): string {
  return `/**
 * Google Apps Script untuk Sistem Pendaftaran Ekstrakurikuler Sepakbola SDN Ulujami 06 Pagi
 * 
 * LANGKAH INSTALASI:
 * 1. Buka spreadsheet Google Anda (atau buat baru).
 * 2. Klik menu "Ekstensi" -> "Apps Script" (Extensions -> Apps Script).
 * 3. Hapus semua kode default di dalam editor (function myFunction() {}).
 * 4. Tempelkan seluruh kode di bawah ini ke dalam editor.
 * 5. Klik tombol Simpan (ikon disket) atau tekan Ctrl+S / Cmd+S.
 * 6. Klik tombol "Terapkan" -> "Penerapan Baru" (Deploy -> New Deployment).
 * 7. Pilih tipe penerapan: "Aplikasi Web" (Web App).
 * 8. Konfigurasi Penerapan:
 *    - Deskripsi: Pendaftaran Sepakbola v1
 *    - Jalankan sebagai: Saya (Execute as: Me)
 *    - Siapa yang memiliki akses: Siapa saja (Who has access: Anyone)
 * 9. Klik "Terapkan" (Deploy).
 * 10. Jika diminta otorisasi, berikan izin (klik "Advanced" -> "Go to ... (unsafe)" -> "Allow").
 * 11. Salin "URL Aplikasi Web" (Web App URL) yang dihasilkan.
 * 12. Tempel URL tersebut ke halaman Pengaturan/Admin aplikasi ini!
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: "error", message: "Data kosong" });
    }

    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Pendaftar");
    
    // Jika sheet "Pendaftar" belum ada, buat baru beserta header kolomnya
    if (!sheet) {
      sheet = ss.insertSheet("Pendaftar");
      var headers = [
        "Waktu Pendaftaran",
        "ID Pendaftaran",
        "Tipe Pendaftaran",
        "Nama Lengkap",
        "Tempat Lahir",
        "Tanggal Lahir",
        "Kelas",
        "Tinggi Badan (cm)",
        "Berat Badan (kg)",
        "Pernyataan Kesediaan"
      ];
      sheet.appendRow(headers);
      
      // Styling header agar rapi (Tema Emerald Green)
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#047857") // emerald-700
                 .setFontColor("#ffffff")
                 .setFontWeight("bold")
                 .setHorizontalAlignment("center")
                 .setVerticalAlignment("middle");
      
      sheet.setRowHeight(1, 28);
      sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).setFontFamily("Arial");
    }
    
    // Format tanggal pendaftaran ke zona waktu lokal
    var formattedDate = "";
    if (data.registeredAt) {
      try {
        formattedDate = Utilities.formatDate(new Date(data.registeredAt), "GMT+7", "yyyy-MM-dd HH:mm:ss");
      } catch (err) {
        formattedDate = data.registeredAt;
      }
    }
    
    var tipePendaftaran = data.registrationType === "baru" ? "Pendaftaran Baru" : "Daftar Ulang";
    var kelas = data.classNumber + "-" + data.classLetter;
    var bersedia = data.agreedToTerms ? "Ya, Bersedia" : "Tidak Bersedia";
    
    // Masukkan data baris baru
    sheet.appendRow([
      formattedDate,
      data.id,
      tipePendaftaran,
      data.fullName,
      data.birthPlace,
      data.birthDate,
      kelas,
      data.height,
      data.weight,
      bersedia
    ]);
    
    // Auto-resize kolom agar pas dengan panjang konten
    sheet.autoResizeColumns(1, 10);
    
    return createJsonResponse({ status: "success" });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function doGet(e) {
  return createJsonResponse({ 
    status: "success", 
    message: "Google Apps Script aktif! Gunakan metode POST untuk mengirimkan data pendaftaran." 
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
