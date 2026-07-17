export interface ClinicSettings {
  logo: string; // Base64 data URI
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  signature: string; // Base64 data URI
  footerText: string;
}

export interface PatientInfo {
  name: string;
  companyName: string;
  address: string;
  country: string;
  phone: string;
  passportId: string;
  date: string;
  invoiceNo: string;
  refNo: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  packQty: number; // e.g. 5
  unit: string;    // e.g. "Pack", "Bottle", "Tablets"
  rate: number;    // Price per pack
  total: number;   // Calculated packQty * rate
  morning: string; // Dosage or check (e.g. "1", "0", "1/2")
  noon: string;
  night: string;
  foodInstruction: string; // "Before Food" | "After Food" | "With Hot Water" etc.
  remarks: string;
}

export interface SavedDraft {
  patientInfo: PatientInfo;
  medicines: MedicineItem[];
  createdAt: string;
  id: string;
}

export type ActiveTab = 'dashboard' | 'patient' | 'medicines' | 'preview' | 'settings';
