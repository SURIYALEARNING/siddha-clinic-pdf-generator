import React from 'react';
import { useClinic } from '../context/ClinicContext';
import { User, ClipboardList, Globe, Phone, FileText, Calendar, Building, Landmark } from 'lucide-react';

export const PatientFormPage: React.FC = () => {
  const { patientInfo, updatePatientInfo, errors, setActiveTab, validateForm, saveCurrentDraft } = useClinic();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updatePatientInfo({
      ...patientInfo,
      [name]: value
    });
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPatientValid = !!patientInfo.name.trim() && !!patientInfo.country.trim();
    if (!isPatientValid) {
      alert("Please fill in the required fields (Patient Name and Country) first.");
      return;
    }
    await saveCurrentDraft();
    setActiveTab('medicines');
  };

  return (
    <div id="patient-form-container" className="max-w-4xl mx-auto space-y-6">
      
      {/* Clinic Header Branding Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 justify-between shadow-xs">
        <div className="text-center sm:text-left space-y-1">
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Active System Provider</p>
          <h2 className="text-lg font-bold text-slate-800">LAKSHMI HEALTH CARE CENTRE ROCKFORT</h2>
          <p className="text-xs text-slate-500">Siddha Clinic Document Administration Panel</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-center sm:text-right text-xs">
          <span className="text-slate-400 font-medium">Invoice Reference</span>
          <p className="font-mono font-bold text-slate-800 text-sm">{patientInfo.invoiceNo}</p>
        </div>
      </div>

      <form onSubmit={handleNextStep} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-base">Patient Demographics & Travel Record</h3>
        </div>

        {/* Form fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Patient Name */}
          <div className="space-y-1">
            <label htmlFor="patient-name-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Patient Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="patient-name-input"
                name="name"
                value={patientInfo.name}
                onChange={handleChange}
                placeholder="e.g. Anand Kumar"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-colors outline-hidden ${
                  errors.name 
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' 
                    : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-500 font-semibold">{errors.name}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-1">
            <label htmlFor="patient-company-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Company Name (Optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Building className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="patient-company-input"
                name="companyName"
                value={patientInfo.companyName}
                onChange={handleChange}
                placeholder="e.g. Apollo Global Inc."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="patient-address-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Permanent Address
            </label>
            <textarea
              id="patient-address-input"
              name="address"
              rows={2}
              value={patientInfo.address}
              onChange={handleChange}
              placeholder="e.g. Flat 3B, Raj Residency, Thillai Nagar, Trichy, Tamil Nadu"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden resize-none"
            />
          </div>

          {/* Country */}
          <div className="space-y-1">
            <label htmlFor="patient-country-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Destination / Residence Country <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="patient-country-input"
                name="country"
                value={patientInfo.country}
                onChange={handleChange}
                placeholder="e.g. United Kingdom"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-colors outline-hidden ${
                  errors.country 
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' 
                    : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
              />
            </div>
            {errors.country && (
              <p className="text-[11px] text-rose-500 font-semibold">{errors.country}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label htmlFor="patient-phone-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="patient-phone-input"
                name="phone"
                value={patientInfo.phone}
                onChange={handleChange}
                placeholder="e.g. +91 9876543210"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
              />
            </div>
          </div>

          {/* OP No */}
          <div className="space-y-1">
            <label htmlFor="patient-opno-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              OP No
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="patient-opno-input"
                name="opNo"
                value={patientInfo.opNo || ''}
                onChange={handleChange}
                placeholder="e.g. OP-2024-001"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
              />
            </div>
          </div>

          {/* Age */}
          <div className="space-y-1">
            <label htmlFor="patient-age-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Age
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="patient-age-input"
                name="age"
                value={patientInfo.age || ''}
                onChange={handleChange}
                placeholder="e.g. 35"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
              />
            </div>
          </div>

          {/* Sex */}
          <div className="space-y-1">
            <label htmlFor="patient-sex-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Sex
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <select
                id="patient-sex-input"
                name="sex"
                value={patientInfo.sex || ''}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden appearance-none bg-white"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Passport / ID Number */}
          <div className="space-y-1">
            <label htmlFor="patient-passport-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Passport / Govt ID Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Landmark className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="patient-passport-input"
                name="passportId"
                value={patientInfo.passportId}
                onChange={handleChange}
                placeholder="e.g. Z9876543 (For Custom clearances)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
              />
            </div>
          </div>

          {/* Diagnosis */}
          <div className="space-y-1 md:col-span-2">
            <label htmlFor="patient-diagnosis-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Diagnosis
            </label>
            <textarea
              id="patient-diagnosis-input"
              name="diagnosis"
              rows={2}
              value={patientInfo.diagnosis || ''}
              onChange={handleChange}
              placeholder="e.g. Psoriasis, Chronic joint pain, Respiratory issues"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden resize-none"
            />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label htmlFor="patient-date-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Prescription / Bill Date
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                id="patient-date-input"
                name="date"
                value={patientInfo.date}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
              />
            </div>
          </div>

          {/* Invoice No (Auto Generated but showing) */}
          <div className="space-y-1">
            <label htmlFor="patient-invoice-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Invoice Number (System Generated)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-300">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="patient-invoice-input"
                name="invoiceNo"
                value={patientInfo.invoiceNo}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm font-mono font-medium outline-hidden cursor-not-allowed"
              />
            </div>
          </div>

          {/* Reference No (Auto Generated but editable if needed) */}
          <div className="space-y-1">
            <label htmlFor="patient-ref-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Reference ID / File ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                id="patient-ref-input"
                name="refNo"
                value={patientInfo.refNo}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-mono font-medium outline-hidden"
              />
            </div>
          </div>

        </div>

        {/* Actions panel */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4">
          <p className="text-xs text-slate-400 font-semibold">* Required fields</p>
          <button
            type="submit"
            id="patient-btn-continue"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/10 border border-blue-600"
          >
            Continue to Medicine Entry
          </button>
        </div>

      </form>
    </div>
  );
};
