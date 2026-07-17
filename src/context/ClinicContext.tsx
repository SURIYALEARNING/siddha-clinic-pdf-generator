import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClinicSettings, PatientInfo, MedicineItem, SavedDraft, ActiveTab } from '../types';
import { getDefaultLogo, getDefaultSignature } from '../utils/defaultImages';

interface ClinicContextType {
  settings: ClinicSettings;
  patientInfo: PatientInfo;
  medicines: MedicineItem[];
  savedDrafts: SavedDraft[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  updateSettings: (settings: ClinicSettings) => void;
  updatePatientInfo: (info: PatientInfo) => void;
  updateMedicines: (medicines: MedicineItem[]) => void;
  saveCurrentDraft: () => SavedDraft;
  loadDraft: (id: string) => void;
  deleteDraft: (id: string) => void;
  resetPatientForm: () => void;
  errors: Record<string, string>;
  validateForm: () => boolean;
  clearErrors: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

// Helper to generate unique codes
const generateInvoiceNo = (existingCount: number): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const serial = String(existingCount + 1).padStart(3, '0');
  return `LHCC-${year}${month}${day}-${serial}`;
};

const generateRefNo = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `LHCC/REF/${new Date().getFullYear()}/${num}`;
};

const defaultSettings: ClinicSettings = {
  logo: '', // Will be set programmatically
  name: "Lakshmi Health Care Centre Rockfort",
  address: "12, Rockfort Bazaar Street, Trichy - 620002, Tamil Nadu, India",
  phone: "+91 431 2704111",
  email: "info@lakshmihealthcare.com",
  website: "www.lakshmihealthcare.com",
  signature: '', // Will be set programmatically
  footerText: "Thank you for choosing Lakshmi Health Care Centre. Authentic Siddha & Herbal Formulations."
};

const initialPatient = (invoiceCount: number): PatientInfo => {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  return {
    name: '',
    companyName: '',
    address: '',
    country: '',
    phone: '',
    passportId: '',
    date: formattedDate,
    invoiceNo: generateInvoiceNo(invoiceCount),
    refNo: generateRefNo()
  };
};

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved drafts first
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>(() => {
    const local = localStorage.getItem('lhcc_saved_drafts');
    return local ? JSON.parse(local) : [];
  });

  // Settings
  const [settings, setSettings] = useState<ClinicSettings>(() => {
    const local = localStorage.getItem('lhcc_clinic_settings');
    if (local) {
      return JSON.parse(local);
    }
    // Return default but generate images programmatically
    return {
      ...defaultSettings,
      logo: getDefaultLogo(),
      signature: getDefaultSignature()
    };
  });

  // Active Patient Info
  const [patientInfo, setPatientInfo] = useState<PatientInfo>(() => {
    const local = localStorage.getItem('lhcc_active_patient');
    if (local) {
      return JSON.parse(local);
    }
    // We pass savedDrafts.length to generate serial index
    const localDrafts = localStorage.getItem('lhcc_saved_drafts');
    const draftsCount = localDrafts ? JSON.parse(localDrafts).length : 0;
    return initialPatient(draftsCount);
  });

  // Active Medicines list
  const [medicines, setMedicines] = useState<MedicineItem[]>(() => {
    const local = localStorage.getItem('lhcc_active_medicines');
    return local ? JSON.parse(local) : [
      {
        id: '1',
        name: 'Sanjeevi Parpam',
        packQty: 2,
        unit: 'Bottles (100g)',
        rate: 450,
        total: 900,
        morning: '1/2 tsp',
        noon: '0',
        night: '1/2 tsp',
        foodInstruction: 'After Food',
        remarks: 'Take with warm honey'
      },
      {
        id: '2',
        name: 'Nilavembu Kudineer Powder',
        packQty: 1,
        unit: 'Pack (200g)',
        rate: 350,
        total: 350,
        morning: '1 cup',
        noon: '0',
        night: '1 cup',
        foodInstruction: 'Before Food',
        remarks: 'Boil with 200ml water'
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save active state to localStorage on any edits
  useEffect(() => {
    localStorage.setItem('lhcc_clinic_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('lhcc_active_patient', JSON.stringify(patientInfo));
  }, [patientInfo]);

  useEffect(() => {
    localStorage.setItem('lhcc_active_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('lhcc_saved_drafts', JSON.stringify(savedDrafts));
  }, [savedDrafts]);

  const updateSettings = (newSettings: ClinicSettings) => {
    setSettings(newSettings);
  };

  const updatePatientInfo = (info: PatientInfo) => {
    setPatientInfo(info);
    // Remove errors for valid edits
    if (info.name && errors.name) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.name;
        return copy;
      });
    }
    if (info.country && errors.country) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.country;
        return copy;
      });
    }
  };

  const updateMedicines = (newMedicines: MedicineItem[]) => {
    const calculated = newMedicines.map(m => ({
      ...m,
      total: Number((m.packQty * m.rate).toFixed(2))
    }));
    setMedicines(calculated);
    if (calculated.length > 0 && errors.medicines) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.medicines;
        return copy;
      });
    }
  };

  const saveCurrentDraft = (): SavedDraft => {
    // Check if we already have this record to update or if it's new
    const existingIndex = savedDrafts.findIndex(d => d.patientInfo.invoiceNo === patientInfo.invoiceNo);
    
    const draft: SavedDraft = {
      id: existingIndex >= 0 ? savedDrafts[existingIndex].id : Math.random().toString(36).substr(2, 9),
      patientInfo: { ...patientInfo },
      medicines: [...medicines],
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...savedDrafts];
      updated[existingIndex] = draft;
      setSavedDrafts(updated);
    } else {
      // Append new
      setSavedDrafts(prev => [draft, ...prev]);
    }

    return draft;
  };

  const loadDraft = (id: string) => {
    const draft = savedDrafts.find(d => d.id === id);
    if (draft) {
      setPatientInfo({ ...draft.patientInfo });
      setMedicines([...draft.medicines]);
      setErrors({});
      setActiveTab('patient');
    }
  };

  const deleteDraft = (id: string) => {
    setSavedDrafts(prev => prev.filter(d => d.id !== id));
  };

  const resetPatientForm = () => {
    setPatientInfo(initialPatient(savedDrafts.length));
    setMedicines([]);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!patientInfo.name.trim()) {
      errs.name = "Patient Name is required.";
    }
    if (!patientInfo.country.trim()) {
      errs.country = "Country is required.";
    }
    if (medicines.length === 0) {
      errs.medicines = "At least one medicine must be added.";
    }
    
    medicines.forEach((med, i) => {
      if (!med.name.trim()) {
        errs[`med_name_${i}`] = "Medicine Name is required.";
      }
      if (isNaN(med.rate) || med.rate <= 0) {
        errs[`med_rate_${i}`] = "Rate must be a positive number.";
      }
      if (isNaN(med.packQty) || med.packQty <= 0) {
        errs[`med_qty_${i}`] = "Pack Quantity must be positive.";
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
  };

  return (
    <ClinicContext.Provider value={{
      settings,
      patientInfo,
      medicines,
      savedDrafts,
      activeTab,
      setActiveTab,
      updateSettings,
      updatePatientInfo,
      updateMedicines,
      saveCurrentDraft,
      loadDraft,
      deleteDraft,
      resetPatientForm,
      errors,
      validateForm,
      clearErrors
    }}>
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
