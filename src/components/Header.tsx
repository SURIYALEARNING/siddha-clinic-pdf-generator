import React from 'react';
import { useClinic } from '../context/ClinicContext';
import { PlusCircle, Save, FileText, CheckCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    patientInfo, 
    medicines, 
    saveCurrentDraft, 
    resetPatientForm, 
    setActiveTab,
    validateForm 
  } = useClinic();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'System Dashboard';
      case 'patient':
        return 'Patient Registration';
      case 'medicines':
        return 'Medicine Formula & Dosage';
      case 'preview':
        return 'Document Hub & PDF Previews';
      case 'settings':
        return 'Clinic Profile Configuration';
      default:
        return 'Siddha Clinic Admin';
    }
  };

  const handleSaveDraft = () => {
    const draft = saveCurrentDraft();
    alert(`Draft saved successfully for patient: ${draft.patientInfo.name || 'Untitled'}\nInvoice No: ${draft.patientInfo.invoiceNo}`);
  };

  const handleGenerate = () => {
    if (validateForm()) {
      saveCurrentDraft();
      setActiveTab('preview');
    } else {
      alert("Please fix the validation errors in Patient Information and Medicine Entry first.");
    }
  };

  return (
    <header id="clinic-header" className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800">{getPageTitle()}</h2>
        {patientInfo.name && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Active: {patientInfo.name}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Save Draft */}
        <button
          id="header-btn-save"
          onClick={handleSaveDraft}
          className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 transition-all"
          title="Save to Drafts list"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save Draft</span>
        </button>

        {/* New Patient Form */}
        <button
          id="header-btn-new"
          onClick={() => {
            if (confirm("Are you sure you want to clear current fields and start a fresh patient?")) {
              resetPatientForm();
              setActiveTab('patient');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold border border-rose-100 transition-all"
          title="Reset form for new patient"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Patient</span>
        </button>

        {/* Generate / Preview Hub */}
        <button
          id="header-btn-generate"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-600/10 hover:shadow-md transition-all border border-blue-600"
        >
          <FileText className="w-4 h-4" />
          <span>Generate PDFs</span>
        </button>
      </div>
    </header>
  );
};
