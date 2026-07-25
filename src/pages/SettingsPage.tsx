import React, { useState, useRef, useEffect } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useToast } from '../context/ToastContext';
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
  FileSignature,
  Stethoscope,
  ChevronDown,
  Plus,
  Trash2,
  UserPlus,
  Stamp
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, addDoctor, removeDoctor, loadingDoctors } = useClinic();
  const toast = useToast();

  const [formSettings, setFormSettings] = useState<ClinicSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    setFormSettings(prev => ({
      ...prev,
      doctors: settings.doctors,
      selectedDoctorId: settings.selectedDoctorId,
    }));
  }, [settings.doctors, settings.selectedDoctorId]);
  const [logoDragActive, setLogoDragActive] = useState<boolean>(false);
  const [sigDragActive, setSigDragActive] = useState<boolean>(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  // New doctor form state
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorQualification, setNewDoctorQualification] = useState('');
  const [newDoctorSignature, setNewDoctorSignature] = useState<File | null>(null);
  const [newDoctorSeal, setNewDoctorSeal] = useState<File | null>(null);
  const [newDoctorSigPreview, setNewDoctorSigPreview] = useState('');
  const [newDoctorSealPreview, setNewDoctorSealPreview] = useState('');
  const [newDoctorSigDrag, setNewDoctorSigDrag] = useState(false);
  const [newDoctorSealDrag, setNewDoctorSealDrag] = useState(false);
  const newDocSigRef = useRef<HTMLInputElement>(null);
  const newDocSealRef = useRef<HTMLInputElement>(null);

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

  const handleNewDoctorImage = (file: File, type: 'signature' | 'seal') => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (PNG/JPG).");
      return;
    }
    if (type === 'signature') {
      setNewDoctorSignature(file);
      setNewDoctorSigPreview(URL.createObjectURL(file));
    } else {
      setNewDoctorSeal(file);
      setNewDoctorSealPreview(URL.createObjectURL(file));
    }
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

  // New doctor signature drag
  const handleNewDocSigDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setNewDoctorSigDrag(true);
    else if (e.type === "dragleave") setNewDoctorSigDrag(false);
  };
  const handleNewDocSigDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewDoctorSigDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleNewDoctorImage(e.dataTransfer.files[0], 'signature');
  };

  // New doctor seal drag
  const handleNewDocSealDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setNewDoctorSealDrag(true);
    else if (e.type === "dragleave") setNewDoctorSealDrag(false);
  };
  const handleNewDocSealDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewDoctorSealDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleNewDoctorImage(e.dataTransfer.files[0], 'seal');
  };

  const handleAddDoctor = async () => {
    if (!newDoctorName.trim()) {
      toast.addToast('Doctor name is required.', 'error');
      return;
    }
    try {
      await addDoctor({
        name: newDoctorName.trim(),
        qualification: newDoctorQualification.trim() || 'B.S.M.S',
        signature: newDoctorSignature,
        seal: newDoctorSeal,
      });
      toast.addToast('Doctor added successfully.', 'success');
      setNewDoctorName('');
      setNewDoctorQualification('');
      setNewDoctorSignature(null);
      setNewDoctorSeal(null);
      setNewDoctorSigPreview('');
      setNewDoctorSealPreview('');
    } catch {
      toast.addToast('Failed to add doctor. Check your connection.', 'error');
    }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    if (!confirm("Remove this doctor from the list?")) return;
    try {
      await removeDoctor(doctorId);
      toast.addToast('Doctor removed successfully.', 'success');
    } catch {
      toast.addToast('Failed to remove doctor. Check your connection.', 'error');
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
    if (confirm("Reset to currently selected doctor's signature?")) {
      const doctor = formSettings.doctors.find(d => d.id === formSettings.selectedDoctorId);
      if (doctor && doctor.signature) {
        setFormSettings(prev => ({
          ...prev,
          signature: doctor.signature!
        }));
      } else {
        setFormSettings(prev => ({
          ...prev,
          signature: getDefaultSignature()
        }));
      }
    }
  };

  return (
    <div id="settings-form-container" className="max-w-4xl mx-auto space-y-6">

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold shadow-md animate-fade-in shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Clinic settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* Doctor Management */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Manage Doctors</h3>
          </div>

          {/* Select Active Doctor */}
          {formSettings.doctors.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <select
                  value={formSettings.selectedDoctorId}
                  onChange={(e) => {
                    const doctorId = e.target.value;
                    const doctor = formSettings.doctors.find(d => d.id === doctorId);
                    if (doctor) {
                      setFormSettings(prev => ({
                        ...prev,
                        selectedDoctorId: doctorId,
                        signature: doctor.signature || prev.signature
                      }));
                    }
                  }}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-semibold outline-hidden appearance-none bg-white"
                >
                  <option value="">-- Select Active Doctor --</option>
                  {formSettings.doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.qualification})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {formSettings.selectedDoctorId && (
                <div className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 shrink-0">
                  Active: <span className="font-bold text-blue-700">
                    {formSettings.doctors.find(d => d.id === formSettings.selectedDoctorId)?.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Existing Doctors List */}
          {formSettings.doctors.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Registered Doctors</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formSettings.doctors.map(doc => (
                  <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${doc.id === formSettings.selectedDoctorId
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                      <p className="text-[10px] text-slate-500">{doc.qualification}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {doc.signature && (
                          <img src={doc.signature} alt="Sig" className="h-5 object-contain" referrerPolicy="no-referrer" />
                        )}
                        {doc.seal && (
                          <img src={doc.seal} alt="Seal" className="h-5 object-contain" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoctor(doc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      title="Remove doctor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formSettings.doctors.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-400">
              No doctors added yet. Add your first doctor below.
            </div>
          )}

          {/* Add New Doctor Form */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-bold text-slate-700">Add New Doctor</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Doctor Name</label>
                <input
                  type="text"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  placeholder="e.g. Dr. S. Lakshmi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-semibold outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">Qualification</label>
                <input
                  type="text"
                  value={newDoctorQualification}
                  onChange={(e) => setNewDoctorQualification(e.target.value)}
                  placeholder="e.g. M.D (Siddha)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-semibold outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Signature Upload */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <FileSignature className="w-3 h-3" /> Signature
                </label>
                {newDoctorSignature ? (
                  <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center">
                    <img src={newDoctorSigPreview} alt="Signature" className="h-8 object-contain" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => { setNewDoctorSignature(null); setNewDoctorSigPreview(''); }}
                      className="absolute top-1 right-1 p-0.5 rounded text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleNewDocSigDrag}
                    onDragOver={handleNewDocSigDrag}
                    onDragLeave={handleNewDocSigDrag}
                    onDrop={handleNewDocSigDrop}
                    onClick={() => newDocSigRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${newDoctorSigDrag
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                  >
                    <input
                      ref={newDocSigRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleNewDoctorImage(e.target.files[0], 'signature')}
                    />
                    <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-slate-500">Upload Signature</p>
                  </div>
                )}
              </div>

              {/* Seal Upload */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                  <Stamp className="w-3 h-3" /> Seal Image
                </label>
                {newDoctorSeal ? (
                  <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center">
                    <img src={newDoctorSealPreview} alt="Seal" className="h-8 object-contain" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => { setNewDoctorSeal(null); setNewDoctorSealPreview(''); }}
                      className="absolute top-1 right-1 p-0.5 rounded text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleNewDocSealDrag}
                    onDragOver={handleNewDocSealDrag}
                    onDragLeave={handleNewDocSealDrag}
                    onDrop={handleNewDocSealDrop}
                    onClick={() => newDocSealRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${newDoctorSealDrag
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                  >
                    <input
                      ref={newDocSealRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleNewDoctorImage(e.target.files[0], 'seal')}
                    />
                    <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-slate-500">Upload Seal</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddDoctor}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Doctor
            </button>
          </div>
        </div>

        {/* Profile Card details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">

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


          {/* SIGNATURE DRAG DROP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">Active Signature (Override)</h4>
              </div>
              <button
                type="button"
                onClick={resetSignatureToDefault}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                title="Reset to selected doctor's signature"
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

            <div
              onDragEnter={handleSigDrag}
              onDragOver={handleSigDrag}
              onDragLeave={handleSigDrag}
              onDrop={handleSigDrop}
              onClick={() => sigInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${sigDragActive
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
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 2MB. Transparent/white background.</p>
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
            <span>Save All Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
};
