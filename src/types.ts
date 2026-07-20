export type RegistrationType = 'baru' | 'ulang';

export interface StudentRegistration {
  id: string;
  registrationType: RegistrationType;
  fullName: string;
  birthPlace: string;
  birthDate: string;
  classNumber: string; // "1", "2", "3", "4", "5", "6"
  classLetter: string;  // "A", "B", "C", or other custom suffixes
  height: number;      // in cm
  weight: number;      // in kg
  agreedToTerms: boolean;
  registeredAt: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  errorMessage?: string;
}

export interface GoogleSheetConfig {
  appsScriptUrl: string;
  spreadsheetUrl?: string; // Optional Spreadsheet URL for opening in new tab
}
