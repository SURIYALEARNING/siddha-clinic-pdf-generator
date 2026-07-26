import React from 'react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Pill, 
  FileText, 
  DollarSign, 
  ArrowRight, 
  History, 
  Trash2, 
  FolderOpen,
  UserCheck,
  BriefcaseMedical
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    patientInfo, 
    medicines, 
    savedDrafts, 
    loadDraft, 
    deleteDraft, 
    setActiveTab,
    resetPatientForm,
    loadingDrafts
  } = useClinic();

  const totalBillValue = medicines.reduce((sum, item) => sum + item.total, 0);

  const handleStartNewPatient = () => {
    resetPatientForm();
    setActiveTab('patient');
  };

  return (
    <div id="dashboard-container" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Siddha Clinic Document Hub</h3>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            Welcome back{user ? `, ${user.name}` : ''}! Easily register patients, formulate traditional Indian herbal prescriptions, auto-calculate bills, and instantly generate official Annexure-1, Cash Bills, and Travel Certificates.
          </p>
        </div>
        <button
          id="dash-btn-quickstart"
          onClick={handleStartNewPatient}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all border border-blue-600 whitespace-nowrap"
        >
          <span>Register New Patient</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Patient */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Patient</p>
            <h4 className="text-sm font-bold text-slate-800 truncate">
              {patientInfo.name || "No Patient Loaded"}
            </h4>
            <p className="text-[10px] text-slate-500 truncate">
              {patientInfo.country ? `From: ${patientInfo.country}` : "Ready for entry"}
            </p>
          </div>
        </div>

        {/* Medicines Count */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Medicines Formulated</p>
            <h4 className="text-sm font-bold text-slate-800">{medicines.length} Items</h4>
            <p className="text-[10px] text-slate-500">In current active draft</p>
          </div>
        </div>

        {/* Current Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Invoice Value</p>
            <h4 className="text-sm font-bold text-slate-800">
              INR {totalBillValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h4>
            <p className="text-[10px] text-slate-500">Auto calculated</p>
          </div>
        </div>

        {/* History Drafts count */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Saved Drafts</p>
            <h4 className="text-sm font-bold text-slate-800">{savedDrafts.length} Records</h4>
            <p className="text-[10px] text-slate-500">{loadingDrafts ? 'Loading...' : 'Saved to cloud'}</p>
          </div>
        </div>
      </div>

      {/* Main Content Areas: Active Draft Summary & History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Column: Current Active Draft Progress */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Active Draft Progress</h3>
          </div>

          <div className="space-y-3.5">
            {/* Status Step 1 */}
            <div className="flex items-start gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                patientInfo.name 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                1
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-700">Patient Details</h4>
                <p className="text-[10px] text-slate-500 truncate">
                  {patientInfo.name 
                    ? `Registered: ${patientInfo.name}` 
                    : "Enter patient details, country, passport/ID."
                  }
                </p>
              </div>
            </div>

            {/* Status Step 2 */}
            <div className="flex items-start gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                medicines.length > 0 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                2
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-700">Medicine Formulations</h4>
                <p className="text-[10px] text-slate-500 truncate">
                  {medicines.length > 0 
                    ? `${medicines.length} medicines, rates, and dosage loaded.` 
                    : "Configure traditional Indian herbals list."
                  }
                </p>
              </div>
            </div>

            {/* Status Step 3 */}
            <div className="flex items-start gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                (patientInfo.name && medicines.length > 0) 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                3
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-700">Document Generation</h4>
                <p className="text-[10px] text-slate-500 truncate">
                  Ready to compile Annexure-1, Bill, & Travel Certificate.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 mt-4 text-xs text-slate-600">
            <div className="flex justify-between gap-2">
              <span className="font-semibold text-slate-500 shrink-0">Invoice:</span>
              <span className="font-mono font-medium text-slate-800 text-right">{patientInfo.invoiceNo}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-semibold text-slate-500 shrink-0">Ref ID:</span>
              <span className="font-mono font-medium text-slate-800 truncate max-w-[160px] sm:max-w-[200px]">{patientInfo.refNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Total Medicines:</span>
              <span className="font-medium text-slate-800">{medicines.length} items</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              id="dash-btn-fill-patient"
              onClick={() => setActiveTab('patient')}
              className="w-full text-center py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
            >
              Fill Details
            </button>
            <button
              id="dash-btn-add-meds"
              onClick={() => setActiveTab('medicines')}
              className="w-full text-center py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
            >
              Formula Entry
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Saved Records / History List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Saved Patient History & Drafts</h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
              {savedDrafts.length} Saved
            </span>
          </div>

          {savedDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="p-4 bg-slate-50 rounded-full text-slate-400 border border-slate-100">
                <BriefcaseMedical className="w-8 h-8" />
              </div>
              <div className="max-w-xs">
                <h4 className="text-xs font-bold text-slate-700">No Patient Records Yet</h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Once you register a patient and hit "Save Draft", their historical profile will be archived here for instant lookup.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table id="dash-history-table" className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Patient / Invoice</th>
                    <th className="py-2.5">Country</th>
                    <th className="py-2.5 text-center">Meds</th>
                    <th className="py-2.5 text-right">Invoice Value</th>
                    <th className="py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {savedDrafts.map((draft) => {
                    const totalCost = draft.medicines.reduce((s, m) => s + m.total, 0);
                    return (
                      <tr key={draft.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-3">
                          <div>
                            <p className="font-bold text-slate-800">{draft.patientInfo.name || "Unnamed Patient"}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{draft.patientInfo.invoiceNo}</p>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600">
                          {draft.patientInfo.country || "N/A"}
                        </td>
                        <td className="py-3 text-center text-slate-800 font-semibold">
                          {draft.medicines.length}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-800">
                          INR {totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              id={`history-btn-load-${draft.id}`}
                              onClick={() => loadDraft(draft.id)}
                              className="p-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all border border-blue-100 flex items-center gap-1 text-[10px] font-semibold"
                              title="Load record to active workspace"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Load</span>
                            </button>
                            <button
                              id={`history-btn-delete-${draft.id}`}
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete draft for "${draft.patientInfo.name}"?`)) {
                                  deleteDraft(draft.id);
                                }
                              }}
                              className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all border border-rose-100"
                              title="Delete from local archive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
