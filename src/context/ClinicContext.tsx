import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ClinicSettings, PatientInfo, MedicineItem, SavedDraft, ActiveTab, Doctor } from '../types';
import { getDefaultLogo } from '../utils/defaultImages';
import { api } from '../services/api';

async function urlToBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

interface ClinicContextType {
  settings: ClinicSettings;
  patientInfo: PatientInfo;
  medicines: MedicineItem[];
  savedDrafts: SavedDraft[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  updateSettings: (settings: ClinicSettings) => void;
  selectDoctor: (doctorId: string) => void;
  updatePatientInfo: (info: PatientInfo) => void;
  updateMedicines: (medicines: MedicineItem[]) => void;
  saveCurrentDraft: () => Promise<SavedDraft>;
  loadDraft: (id: string) => void;
  deleteDraft: (id: string) => Promise<void>;
  resetPatientForm: () => void;
  errors: Record<string, string>;
  validateForm: () => boolean;
  clearErrors: () => void;
  addDoctor: (data: { name: string; qualification?: string; signature?: File | null; seal?: File | null }) => Promise<void>;
  removeDoctor: (id: string) => Promise<void>;
  loadingDoctors: boolean;
  loadingDrafts: boolean;
  paymentOnline: number;
  paymentCash: number;
  setPaymentOnline: (val: number) => void;
  setPaymentCash: (val: number) => void;
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
  logo: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  signature: '',
  footerText: '',
  doctors: [],
  selectedDoctorId: ''
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
      const parsed = JSON.parse(local);
      if (!parsed.doctors) parsed.doctors = [];
      if (!parsed.selectedDoctorId) parsed.selectedDoctorId = '';
      return parsed;
    }
    return {
      ...defaultSettings,
      logo: getDefaultLogo()
    };
  });

  // Active Patient Info
  // Deactivated by default: starts empty so patient details on the dashboard
  // are only active after the user loads a draft or registers a new patient.
  const [patientInfo, setPatientInfo] = useState<PatientInfo>(() => {
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
  const [paymentOnline, setPaymentOnline] = useState(0);
  const [paymentCash, setPaymentCash] = useState(0);

  useEffect(() => {
    const total = medicines.reduce((s, m) => s + m.total, 0);
    setPaymentOnline(Math.max(0, total - paymentCash));
  }, [medicines]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

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

  const updateSettings = async (newSettings: ClinicSettings) => {
    setSettings(newSettings);
    await api.upsertSettings({
      logo: newSettings.logo,
      name: newSettings.name,
      address: newSettings.address,
      phone: newSettings.phone,
      email: newSettings.email,
      website: newSettings.website,
      signature: newSettings.signature,
      footerText: newSettings.footerText,
      selectedDoctorId: newSettings.selectedDoctorId,
    });
  };

  const selectDoctor = async (doctorId: string) => {
    const doctor = settings.doctors.find(d => d.id === doctorId);
    if (doctor) {
      let sig = doctor.signature || '';
      if (sig && sig.startsWith('http')) {
        try {
          sig = await urlToBase64(sig);
        } catch {
          sig = '';
        }
      }
      setSettings(prev => ({
        ...prev,
        selectedDoctorId: doctorId,
        signature: sig,
      }));
    }
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

  const saveCurrentDraft = async (): Promise<SavedDraft> => {
    const existingIndex = savedDrafts.findIndex(d => d.patientInfo.invoiceNo === patientInfo.invoiceNo);
    const localId = existingIndex >= 0 ? savedDrafts[existingIndex].id : Math.random().toString(36).substr(2, 9);

    const draft: SavedDraft = {
      id: localId,
      patientInfo: { ...patientInfo },
      medicines: [...medicines],
      createdAt: new Date().toISOString()
    };

    const res = await api.saveDraft({
      draftId: existingIndex >= 0 ? localId : undefined,
      patientInfo: patientInfo as any,
      medicines: medicines as any,
    });

    if (!res.error && res.data?.draft) {
      draft.id = res.data.draft._id;
    }

    if (existingIndex >= 0) {
      const updated = [...savedDrafts];
      updated[existingIndex] = draft;
      setSavedDrafts(updated);
    } else {
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

  const deleteDraft = async (id: string) => {
    await api.deleteDraft(id);
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

  const addDoctor = useCallback(async (data: { name: string; qualification?: string; signature?: File | null; seal?: File | null }) => {
    const res = await api.createDoctor(data);
    if (res.error) {
      throw new Error(res.error);
    }
    const doc = res.data!.doctor;
    const [sig, seal] = await Promise.all([
      doc.signature && doc.signature.startsWith('http') ? urlToBase64(doc.signature) : Promise.resolve(doc.signature || ''),
      doc.seal && doc.seal.startsWith('http') ? urlToBase64(doc.seal) : Promise.resolve(doc.seal || ''),
    ]);
    const newDoctor: Doctor = {
      id: doc._id,
      name: doc.name,
      qualification: doc.qualification,
      signature: sig,
      seal: seal,
    };
    setSettings(prev => ({
      ...prev,
      doctors: [...prev.doctors, newDoctor],
    }));
  }, []);

  const removeDoctor = useCallback(async (id: string) => {
    const res = await api.deleteDoctor(id);
    if (res.error) {
      throw new Error(res.error);
    }
    setSettings(prev => {
      const updatedDoctors = prev.doctors.filter(d => d.id !== id);
      const updates: Partial<ClinicSettings> = { doctors: updatedDoctors };
      if (prev.selectedDoctorId === id) {
        updates.selectedDoctorId = updatedDoctors.length > 0 ? updatedDoctors[0].id : '';
        updates.signature = updatedDoctors.length > 0 ? (updatedDoctors[0].signature || prev.signature) : '';
      }
      return { ...prev, ...updates };
    });
  }, []);

  // Fetch doctors from backend on mount
  useEffect(() => {
    (async () => {
      setLoadingDoctors(true);
      try {
        const res = await api.getDoctors();
        if (!res.error && res.data?.doctors) {
          const apiDoctors: Doctor[] = await Promise.all(
            res.data.doctors.map(async (d) => ({
              id: d._id,
              name: d.name,
              qualification: d.qualification,
              signature: d.signature && d.signature.startsWith('http')
                ? await urlToBase64(d.signature)
                : (d.signature || ''),
              seal: d.seal && d.seal.startsWith('http')
                ? await urlToBase64(d.seal)
                : (d.seal || ''),
            })),
          );
          setSettings(prev => {
            const merged = [...apiDoctors];
            const existingIds = new Set(merged.map(d => d.id));
            for (const local of prev.doctors) {
              if (!existingIds.has(local.id)) {
                merged.push(local);
              }
            }
            return { ...prev, doctors: merged };
          });
        }
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
      }
      setLoadingDoctors(false);
    })();
  }, []);

  // Fetch settings from backend on mount
  useEffect(() => {
    (async () => {
      const res = await api.getSettings();
      if (!res.error && res.data?.settings) {
        const s = res.data.settings;
        setSettings(prev => ({
          ...prev,
          logo: s.logo || prev.logo,
          name: s.name || prev.name,
          address: s.address || prev.address,
          phone: s.phone || prev.phone,
          email: s.email || prev.email,
          website: s.website || prev.website,
          signature: s.signature || prev.signature,
          footerText: s.footerText || prev.footerText,
          selectedDoctorId: s.selectedDoctorId || prev.selectedDoctorId,
        }));
      }
    })();
  }, []);

  // Fetch drafts from backend on mount
  useEffect(() => {
    (async () => {
      setLoadingDrafts(true);
      const res = await api.getDrafts();
      if (!res.error && res.data?.drafts) {
        const apiDrafts: SavedDraft[] = res.data.drafts.map(d => ({
          id: d._id,
          patientInfo: d.patientInfo as any,
          medicines: d.medicines as any,
          createdAt: d.createdAt,
        }));
        setSavedDrafts(prev => {
          const apiIds = new Set(apiDrafts.map(d => d.id));
          const merged = [...apiDrafts];
          for (const local of prev) {
            if (!apiIds.has(local.id)) {
              merged.push(local);
            }
          }
          return merged;
        });
      }
      setLoadingDrafts(false);
    })();
  }, []);

  return (
    <ClinicContext.Provider value={{
      settings,
      patientInfo,
      medicines,
      savedDrafts,
      activeTab,
      setActiveTab,
      updateSettings,
      selectDoctor,
      updatePatientInfo,
      updateMedicines,
      saveCurrentDraft,
      loadDraft,
      deleteDraft,
      resetPatientForm,
      errors,
      validateForm,
      clearErrors,
      addDoctor,
      removeDoctor,
      loadingDoctors,
      loadingDrafts,
      paymentOnline,
      paymentCash,
      setPaymentOnline,
      setPaymentCash
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
