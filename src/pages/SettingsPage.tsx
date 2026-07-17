import React, { useState, useRef } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicSettings } from '../types';
import { getDefaultLogo, getDefaultSignature } from '../utils/defaultImages';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Image, 
  Upload, 
  RotateCcw, 
  Save, 
  CheckCircle,
  FileSignature
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useClinic();
  
  const [formSettings, setFormSettings] = useState<ClinicSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [logoDragActive, setLogoDragActive] = useState<boolean>(false);
  const [sigDragActive, setSigDragActive] = useState<boolean>(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (PNG/JPG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormSettings(prev => ({
          ...prev,
          logo: e.target?.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (PNG/JPG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormSettings(prev => ({
          ...prev,
          signature: e.target?.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Logo drag events
  const handleLogoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setLogoDragActive(true);
    } else if (e.type === "dragleave") {
      setLogoDragActive(false);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  // Signature drag events
  const handleSigDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setSigDragActive(true);
    } else if (e.type === "dragleave") {
      setSigDragActive(false);
    }
  };

  const handleSigDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSigDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSignatureFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const resetLogoToDefault = () => {
    if (confirm("Reset clinic branding logo back to standard Siddha Care vector?")) {
      setFormSettings(prev => ({
        ...prev,
        logo: getDefaultLogo()
      }));
    }
  };

  const resetSignatureToDefault = () => {
    if (confirm("Reset practitioner signature back to default Dr. S. Lakshmi, B.S.M.S script?")) {
      setFormSettings(prev => ({
        ...prev,
        signature: getDefaultSignature()
      }));
    }
  };

  return (
    <div id="settings-form-container" className="max-w-4xl mx-auto space-y-6">
      
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold shadow-md animate-fade-in shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Clinic settings and configurations saved and locked successfully to browser local storage.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile Card details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-xs">
          
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Clinic Profile Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Clinic Name */}
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="settings-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Clinic Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Building className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="settings-name"
                  name="name"
                  value={formSettings.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-semibold outline-hidden"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="settings-address" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Clinic Location / Address
              </label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <textarea
                  id="settings-address"
                  name="address"
                  rows={2}
                  value={formSettings.address}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-semibold outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label htmlFor="settings-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Clinic Hotline
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="settings-phone"
                  name="phone"
                  value={formSettings.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="settings-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Administrative Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="settings-email"
                  name="email"
                  value={formSettings.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-1">
              <label htmlFor="settings-website" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Official Website
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="settings-website"
                  name="website"
                  value={formSettings.website}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
                />
              </div>
            </div>

            {/* Footer Text */}
            <div className="space-y-1">
              <label htmlFor="settings-footerText" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Document Footer Slogan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="settings-footerText"
                  name="footerText"
                  value={formSettings.footerText}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium outline-hidden"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Media / Assets Card details (Drag-and-Drop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LOGO DRAG DROP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Image className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">Clinic Branding Logo</h4>
              </div>
              <button
                type="button"
                onClick={resetLogoToDefault}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                title="Reset to default logo template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center justify-center">
              {formSettings.logo ? (
                <div className="relative group border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-32 flex items-center justify-center">
                  <img 
                    src={formSettings.logo} 
                    alt="Clinic Logo Preview" 
                    className="max-h-24 object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-400">No logo loaded</div>
              )}
            </div>

            {/* Drag Zone */}
            <div
              onDragEnter={handleLogoDrag}
              onDragOver={handleLogoDrag}
              onDragLeave={handleLogoDrag}
              onDrop={handleLogoDrop}
              onClick={() => logoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                logoDragActive 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
              />
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Drag logo here, or <span className="text-blue-600">browse</span></p>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, SVG up to 2MB. Recommended shape: Wide banner (4:1 ratio).</p>
            </div>
          </div>

          {/* SIGNATURE DRAG DROP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">Physician Authorized Signature</h4>
              </div>
              <button
                type="button"
                onClick={resetSignatureToDefault}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                title="Reset to default signature template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center justify-center">
              {formSettings.signature ? (
                <div className="relative group border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-32 flex items-center justify-center">
                  <img 
                    src={formSettings.signature} 
                    alt="Signature Preview" 
                    className="max-h-24 object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-400">No signature loaded</div>
              )}
            </div>

            {/* Drag Zone */}
            <div
              onDragEnter={handleSigDrag}
              onDragOver={handleSigDrag}
              onDragLeave={handleSigDrag}
              onDrop={handleSigDrop}
              onClick={() => sigInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                sigDragActive 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={sigInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleSignatureFile(e.target.files[0])}
              />
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Drag signature here, or <span className="text-blue-600">browse</span></p>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 2MB. Ink signature with transparent/white background.</p>
            </div>
          </div>

        </div>

        {/* Action Footers */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            id="settings-btn-save"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/15 border border-blue-600 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Configurations</span>
          </button>
        </div>

      </form>
    </div>
  );
};
