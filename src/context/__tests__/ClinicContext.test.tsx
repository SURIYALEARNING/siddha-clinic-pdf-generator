import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ClinicProvider, useClinic } from '../ClinicContext';

vi.mock('../../services/api', () => ({
  api: {
    getDoctors: vi.fn(),
    getSettings: vi.fn(),
    getDrafts: vi.fn(),
    saveDraft: vi.fn(),
    deleteDraft: vi.fn(),
    upsertSettings: vi.fn(),
    createDoctor: vi.fn(),
    deleteDoctor: vi.fn(),
  },
}));

import { api } from '../../services/api';

function setup() {
  return renderHook(() => useClinic(), { wrapper: ClinicProvider });
}

describe('ClinicContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    (api.getDoctors as any).mockResolvedValue({ data: { doctors: [] } });
    (api.getSettings as any).mockResolvedValue({ data: { settings: null } });
    (api.getDrafts as any).mockResolvedValue({ data: { drafts: [] } });
  });

  it('provides initial state with default values', async () => {
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.loadingDoctors).toBe(false);
    });
    expect(result.current.activeTab).toBe('dashboard');
    expect(result.current.patientInfo.name).toBe('');
    expect(result.current.medicines).toHaveLength(2);
    expect(result.current.settings.name).toBe('');
    expect(result.current.errors).toEqual({});
    expect(result.current.savedDrafts).toEqual([]);
    expect(result.current.paymentOnline).toBe(1250);
    expect(result.current.paymentCash).toBe(0);
  });

  it('updatePatientInfo updates patient info', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'New Patient', country: 'India' });
    });
    expect(result.current.patientInfo.name).toBe('New Patient');
    expect(result.current.patientInfo.country).toBe('India');
  });

  it('updateMedicines calculates total for each medicine', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    const items = [
      { id: '1', name: 'Med A', packQty: 3, unit: 'Bottle', rate: 200, total: 0, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
      { id: '2', name: 'Med B', packQty: 5, unit: 'Pack', rate: 150, total: 0, morning: '0', noon: '1', night: '0', foodInstruction: 'Before Food', remarks: '' },
    ];
    act(() => {
      result.current.updateMedicines(items);
    });
    expect(result.current.medicines[0].total).toBe(600);
    expect(result.current.medicines[1].total).toBe(750);
  });

  it('setActiveTab changes active tab', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    act(() => {
      result.current.setActiveTab('patient');
    });
    expect(result.current.activeTab).toBe('patient');
  });

  it('resetPatientForm resets patient info and medicines', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Test', country: 'US' });
    });
    expect(result.current.patientInfo.name).toBe('Test');

    act(() => {
      result.current.resetPatientForm();
    });
    expect(result.current.patientInfo.name).toBe('');
    expect(result.current.medicines).toHaveLength(0);
    expect(result.current.errors).toEqual({});
  });

  it('validateForm returns false when patient name is empty', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: '', country: 'India' });
    });
    await waitFor(() => {
      expect(result.current.patientInfo.country).toBe('India');
    });
    act(() => {
      result.current.validateForm();
    });
    await waitFor(() => {
      expect(result.current.errors.name).toBeDefined();
    });
  });

  it('validateForm returns false when country is empty', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Test', country: '' });
    });
    await waitFor(() => {
      expect(result.current.patientInfo.name).toBe('Test');
    });
    act(() => {
      result.current.validateForm();
    });
    await waitFor(() => {
      expect(result.current.errors.country).toBeDefined();
    });
  });

  it('validateForm returns false when no medicines', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Test', country: 'India' });
      result.current.updateMedicines([]);
    });
    await waitFor(() => {
      expect(result.current.patientInfo.name).toBe('Test');
    });
    act(() => {
      result.current.validateForm();
    });
    await waitFor(() => {
      expect(result.current.errors.medicines).toBeDefined();
    });
  });

  it('validateForm returns true when all valid', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Test', country: 'India' });
      result.current.updateMedicines([
        { id: '1', name: 'Med A', packQty: 1, unit: 'Bottle', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
      ]);
    });
    const valid = result.current.validateForm();
    expect(valid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('saveCurrentDraft adds draft to savedDrafts list', async () => {
    (api.saveDraft as any).mockResolvedValue({
      data: { draft: { _id: 'api-draft-1', patientInfo: {}, medicines: [], createdAt: new Date().toISOString() } },
    });
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Draft Patient', country: 'India' });
    });

    await act(async () => {
      await result.current.saveCurrentDraft();
    });

    expect(result.current.savedDrafts).toHaveLength(1);
    expect(result.current.savedDrafts[0].id).toBe('api-draft-1');
    expect(result.current.savedDrafts[0].patientInfo.name).toBe('Draft Patient');
  });

  it('deleteDraft removes draft from list', async () => {
    (api.saveDraft as any).mockResolvedValue({
      data: { draft: { _id: 'api-draft-2', patientInfo: {}, medicines: [], createdAt: new Date().toISOString() } },
    });
    (api.deleteDraft as any).mockResolvedValue({ data: { message: 'Deleted' } });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await result.current.saveCurrentDraft();
    });
    expect(result.current.savedDrafts).toHaveLength(1);

    await act(async () => {
      await result.current.deleteDraft(result.current.savedDrafts[0].id);
    });
    expect(result.current.savedDrafts).toHaveLength(0);
  });

  it('loadDraft loads draft data into patientInfo and medicines', async () => {
    (api.saveDraft as any).mockResolvedValue({
      data: { draft: { _id: 'api-draft-3', patientInfo: {}, medicines: [], createdAt: new Date().toISOString() } },
    });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Original', country: 'India' });
    });

    await act(async () => {
      await result.current.saveCurrentDraft();
    });
    const draftId = result.current.savedDrafts[0].id;

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Changed' });
    });
    expect(result.current.patientInfo.name).toBe('Changed');

    act(() => {
      result.current.loadDraft(draftId);
    });
    expect(result.current.patientInfo.name).toBe('Original');
    expect(result.current.activeTab).toBe('patient');
  });

  it('updateSettings calls api.upsertSettings', async () => {
    (api.upsertSettings as any).mockResolvedValue({ data: { settings: {} } });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    const newSettings = { ...result.current.settings, name: 'Updated Clinic' };
    await act(async () => {
      await result.current.updateSettings(newSettings);
    });

    expect(api.upsertSettings).toHaveBeenCalled();
    expect(result.current.settings.name).toBe('Updated Clinic');
  });

  it('addDoctor calls api.createDoctor and adds to doctors list', async () => {
    (api.createDoctor as any).mockResolvedValue({
      data: { doctor: { _id: 'doc-1', name: 'Dr. New', qualification: 'MD', signature: '', seal: '' } },
    });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await result.current.addDoctor({ name: 'Dr. New', qualification: 'MD' });
    });

    expect(api.createDoctor).toHaveBeenCalledWith({ name: 'Dr. New', qualification: 'MD' });
    expect(result.current.settings.doctors).toHaveLength(1);
    expect(result.current.settings.doctors[0].name).toBe('Dr. New');
  });

  it('removeDoctor calls api.deleteDoctor and removes from doctors list', async () => {
    (api.createDoctor as any).mockResolvedValue({
      data: { doctor: { _id: 'doc-1', name: 'Dr. Remove', qualification: 'MD', signature: '', seal: '' } },
    });
    (api.deleteDoctor as any).mockResolvedValue({ data: { message: 'Deleted' } });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await result.current.addDoctor({ name: 'Dr. Remove', qualification: 'MD' });
    });
    expect(result.current.settings.doctors).toHaveLength(1);

    await act(async () => {
      await result.current.removeDoctor('doc-1');
    });
    expect(api.deleteDoctor).toHaveBeenCalledWith('doc-1');
    expect(result.current.settings.doctors).toHaveLength(0);
  });

  it('selectDoctor updates signature from doctor', async () => {
    (api.createDoctor as any).mockResolvedValue({
      data: { doctor: { _id: 'doc-sig', name: 'Dr. Sig', qualification: 'MD', signature: 'base64sig', seal: '' } },
    });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await result.current.addDoctor({ name: 'Dr. Sig', qualification: 'MD' });
    });

    await act(async () => {
      await result.current.selectDoctor('doc-sig');
    });

    expect(result.current.settings.selectedDoctorId).toBe('doc-sig');
    expect(result.current.settings.signature).toBe('base64sig');
  });

  it('clearErrors clears all errors', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: '', country: '' });
      result.current.validateForm();
    });
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.errors).toEqual({});
  });

  it('paymentOnline and paymentCash update correctly', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.setPaymentCash(200);
    });
    expect(result.current.paymentCash).toBe(200);

    act(() => {
      result.current.updateMedicines([
        { id: '1', name: 'Med', packQty: 2, unit: 'Bottle', rate: 500, total: 1000, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
      ]);
    });

    await waitFor(() => {
      expect(result.current.paymentOnline).toBe(800);
    });
  });

  it('throws error when useClinic used outside provider', () => {
    expect(() => renderHook(() => useClinic())).toThrow(
      'useClinic must be used within a ClinicProvider',
    );
  });

  it('updateSettings updates local state even when API fails', async () => {
    (api.upsertSettings as any).mockRejectedValue(new Error('Network error'));
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    const newSettings = { ...result.current.settings, name: 'Failing Clinic' };
    await act(async () => {
      try {
        await result.current.updateSettings(newSettings);
      } catch {
        /* expected */
      }
    });

    expect(result.current.settings.name).toBe('Failing Clinic');
    expect(api.upsertSettings).toHaveBeenCalled();
  });

  it('addDoctor throws when API returns error and does not add doctor', async () => {
    (api.createDoctor as any).mockResolvedValue({ error: 'Name is required' });
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await expect(result.current.addDoctor({ name: '' })).rejects.toThrow('Name is required');
    });
    expect(result.current.settings.doctors).toHaveLength(0);
  });

  it('removeDoctor throws when API returns error and does not change list', async () => {
    (api.createDoctor as any).mockResolvedValue({
      data: { doctor: { _id: 'doc-err', name: 'Dr. Error', qualification: 'MD', signature: '', seal: '' } },
    });
    (api.deleteDoctor as any).mockResolvedValue({ error: 'Doctor not found' });
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await result.current.addDoctor({ name: 'Dr. Error' });
    });
    expect(result.current.settings.doctors).toHaveLength(1);

    await act(async () => {
      await expect(result.current.removeDoctor('doc-err')).rejects.toThrow('Doctor not found');
    });
    expect(result.current.settings.doctors).toHaveLength(1);
  });

  it('loadDraft does nothing when id not found', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    const originalName = result.current.patientInfo.name;
    act(() => {
      result.current.loadDraft('non-existent-id');
    });
    expect(result.current.patientInfo.name).toBe(originalName);
    expect(result.current.activeTab).toBe('dashboard');
  });

  it('validateForm catches invalid medicine fields', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Test', country: 'India' });
      result.current.updateMedicines([
        { id: '1', name: '', packQty: 0, unit: 'Bottle', rate: 0, total: 0, morning: '', noon: '', night: '', foodInstruction: '', remarks: '' },
      ]);
    });
    act(() => {
      result.current.validateForm();
    });
    await waitFor(() => {
      expect(result.current.errors['med_name_0']).toBeDefined();
      expect(result.current.errors['med_rate_0']).toBeDefined();
      expect(result.current.errors['med_qty_0']).toBeDefined();
    });
  });

  it('paymentOnline is never negative when cash exceeds total', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.setPaymentCash(99999);
    });

    act(() => {
      result.current.updateMedicines([
        { id: '1', name: 'Med', packQty: 1, unit: 'Bottle', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
      ]);
    });
    await waitFor(() => {
      expect(result.current.paymentOnline).toBe(0);
    });
  });

  it('selectDoctor does nothing when doctor id not found', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    act(() => {
      result.current.selectDoctor('non-existent');
    });
    expect(result.current.settings.selectedDoctorId).toBe('');
  });

  it('loads doctors from API on mount', async () => {
    (api.getDoctors as any).mockResolvedValue({
      data: { doctors: [{ _id: 'api-doc-1', name: 'API Doctor', qualification: 'PhD', signature: '', seal: '' }] },
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.settings.doctors).toHaveLength(1);
      expect(result.current.settings.doctors[0].name).toBe('API Doctor');
    });
  });

  it('loads settings from API on mount', async () => {
    (api.getSettings as any).mockResolvedValue({
      data: { settings: { logo: '', name: 'Clinic from API', address: '123 St', phone: '555', email: 'c@c.com', website: '', signature: '', footerText: '', selectedDoctorId: '' } },
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.settings.name).toBe('Clinic from API');
    });
  });

  it('updatePatientInfo clears name error when name becomes valid', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: '', country: '' });
    });
    act(() => {
      result.current.validateForm();
    });
    await waitFor(() => {
      expect(result.current.errors.name).toBeDefined();
    });

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Valid Name', country: '' });
    });
    await waitFor(() => {
      expect(result.current.errors.name).toBeUndefined();
    });
  });

  it('updatePatientInfo clears country error when country becomes valid', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: '', country: '' });
    });
    act(() => {
      result.current.validateForm();
    });
    await waitFor(() => {
      expect(result.current.errors.country).toBeDefined();
    });

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: '', country: 'India' });
    });
    await waitFor(() => {
      expect(result.current.errors.country).toBeUndefined();
    });
  });

  it('updateMedicines clears medicines error when medicines are added', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Test', country: 'India' });
      result.current.updateMedicines([]);
    });
    act(() => {
      result.current.validateForm();
    });
    await waitFor(() => {
      expect(result.current.errors.medicines).toBeDefined();
    });

    act(() => {
      result.current.updateMedicines([
        { id: '1', name: 'Med', packQty: 1, unit: 'Bottle', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
      ]);
    });
    await waitFor(() => {
      expect(result.current.errors.medicines).toBeUndefined();
    });
  });

  it('selectDoctor converts http signature URL to base64', async () => {
    const blob = new Blob(['test-sig'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    }));

    (api.createDoctor as any).mockResolvedValue({
      data: { doctor: { _id: 'doc-http', name: 'Dr. HTTP', qualification: 'MD', signature: 'http://example.com/sig.png', seal: '' } },
    });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await result.current.addDoctor({ name: 'Dr. HTTP' });
    });

    await act(async () => {
      await result.current.selectDoctor('doc-http');
    });

    expect(result.current.settings.selectedDoctorId).toBe('doc-http');
    expect(result.current.settings.signature).toBeTruthy();
    expect(result.current.settings.signature).toContain('base64');
  });

  it('selectDoctor handles http signature URL that fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    (api.createDoctor as any).mockResolvedValue({
      data: { doctor: { _id: 'doc-http-fail', name: 'Dr. Fail', qualification: 'MD', signature: 'http://example.com/bad.png', seal: '' } },
    });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await result.current.addDoctor({ name: 'Dr. Fail' });
    });

    await act(async () => {
      await result.current.selectDoctor('doc-http-fail');
    });

    expect(result.current.settings.selectedDoctorId).toBe('doc-http-fail');
    expect(result.current.settings.signature).toBe('');
  });

  it('saveCurrentDraft updates existing draft for same invoice number', async () => {
    (api.saveDraft as any).mockResolvedValue({
      data: { draft: { _id: 'api-update-draft', patientInfo: {}, medicines: [], createdAt: new Date().toISOString() } },
    });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Original', country: 'India' });
    });

    await act(async () => {
      await result.current.saveCurrentDraft();
    });
    expect(result.current.savedDrafts).toHaveLength(1);
    expect(result.current.savedDrafts[0].patientInfo.name).toBe('Original');

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'Updated' });
    });

    await act(async () => {
      await result.current.saveCurrentDraft();
    });

    expect(result.current.savedDrafts).toHaveLength(1);
    expect(result.current.savedDrafts[0].patientInfo.name).toBe('Updated');
  });

  it('removeDoctor updates selectedDoctorId when removed doctor was selected - other doctors remain', async () => {
    (api.createDoctor as any)
      .mockResolvedValueOnce({
        data: { doctor: { _id: 'doc-sel', name: 'Dr. Selected', qualification: 'MD', signature: '', seal: '' } },
      })
      .mockResolvedValueOnce({
        data: { doctor: { _id: 'doc-other', name: 'Dr. Other', qualification: 'MD', signature: '', seal: '' } },
      });
    (api.deleteDoctor as any).mockResolvedValue({ data: { message: 'Deleted' } });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await result.current.addDoctor({ name: 'Dr. Selected' });
    });
    await act(async () => {
      await result.current.addDoctor({ name: 'Dr. Other' });
    });

    await act(async () => {
      await result.current.selectDoctor('doc-sel');
    });
    expect(result.current.settings.selectedDoctorId).toBe('doc-sel');

    await act(async () => {
      await result.current.removeDoctor('doc-sel');
    });
    expect(result.current.settings.selectedDoctorId).toBe('doc-other');
    expect(result.current.settings.doctors).toHaveLength(1);
  });

  it('removeDoctor clears selectedDoctorId when last doctor removed', async () => {
    (api.createDoctor as any).mockResolvedValue({
      data: { doctor: { _id: 'doc-only', name: 'Dr. Only', qualification: 'MD', signature: '', seal: '' } },
    });
    (api.deleteDoctor as any).mockResolvedValue({ data: { message: 'Deleted' } });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    await act(async () => {
      await result.current.addDoctor({ name: 'Dr. Only' });
    });
    await act(async () => {
      await result.current.selectDoctor('doc-only');
    });
    expect(result.current.settings.selectedDoctorId).toBe('doc-only');

    await act(async () => {
      await result.current.removeDoctor('doc-only');
    });
    expect(result.current.settings.selectedDoctorId).toBe('');
    expect(result.current.settings.signature).toBe('');
    expect(result.current.settings.doctors).toHaveLength(0);
  });

  it('mount converts doctor http signatures to base64', async () => {
    const blob = new Blob(['mount-sig'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    }));

    (api.getDoctors as any).mockResolvedValue({
      data: { doctors: [{ _id: 'http-doc', name: 'Dr. Mount', qualification: 'PhD', signature: 'http://example.com/mount-sig.png', seal: '' }] },
    });

    const { result } = setup();
    await waitFor(() => {
      expect(result.current.settings.doctors).toHaveLength(1);
    });
    expect(result.current.settings.doctors[0].signature).toBeTruthy();
    expect(result.current.settings.doctors[0].signature).toContain('base64');
  });

  it('mount merges local drafts with API drafts keeping unsynced ones', async () => {
    const localDraft = {
      id: 'local-unsynced-1',
      patientInfo: { name: 'Local Draft', country: 'India', date: '2026-01-01', invoiceNo: 'LHCC-20260101-001', refNo: 'LHCC/REF/2026/1234' },
      medicines: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const apiDraft = {
      _id: 'api-draft-1',
      patientInfo: { name: 'API Draft', country: 'US' },
      medicines: [],
      createdAt: '2026-01-02T00:00:00.000Z',
    };

    localStorage.setItem('lhcc_saved_drafts', JSON.stringify([localDraft]));
    (api.getDrafts as any).mockResolvedValue({ data: { drafts: [apiDraft] } });

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDrafts).toBe(false));

    expect(result.current.savedDrafts).toHaveLength(2);
    const names = result.current.savedDrafts.map(d => d.patientInfo.name);
    expect(names).toContain('Local Draft');
    expect(names).toContain('API Draft');
  });

  it('loads settings, patient, and medicines from localStorage as initial state', async () => {
    localStorage.setItem('lhcc_clinic_settings', JSON.stringify({
      logo: '', name: 'Local Store', address: 'Addr', phone: '1', email: 'e@e.com',
      website: '', signature: '', footerText: '', doctors: [], selectedDoctorId: '',
    }));
    localStorage.setItem('lhcc_active_patient', JSON.stringify({
      name: 'Stored Patient', companyName: '', address: '', country: 'IN', phone: '',
      passportId: '', date: '2026-07-28', invoiceNo: 'LHCC-20260728-001', refNo: 'LHCC/REF/2026/9999',
    }));
    localStorage.setItem('lhcc_active_medicines', JSON.stringify([
      { id: 'ls1', name: 'Local Med', packQty: 1, unit: 'Bottle', rate: 500, total: 500, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
    ]));

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    expect(result.current.settings.name).toBe('Local Store');
    expect(result.current.patientInfo.name).toBe('Stored Patient');
    expect(result.current.medicines).toHaveLength(1);
    expect(result.current.medicines[0].name).toBe('Local Med');
  });

  it('generates initial patient info with correct invoice and reference number format', async () => {
    localStorage.setItem('lhcc_saved_drafts', JSON.stringify([
      { id: 'd1', patientInfo: {}, medicines: [], createdAt: '2026-01-01T00:00:00.000Z' },
    ]));

    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));
    expect(result.current.patientInfo.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.patientInfo.invoiceNo).toMatch(/^LHCC-\d{8}-\d{3}$/);
    expect(result.current.patientInfo.refNo).toMatch(/^LHCC\/REF\/\d{4}\/\d{4}$/);
  });

  it('auto-saves patient info, settings, and medicines to localStorage on updates', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.loadingDoctors).toBe(false));

    act(() => {
      result.current.updatePatientInfo({ ...result.current.patientInfo, name: 'AutoSave Patient' });
    });
    let stored = JSON.parse(localStorage.getItem('lhcc_active_patient')!);
    expect(stored.name).toBe('AutoSave Patient');

    act(() => {
      result.current.updateMedicines([
        { id: 'as1', name: 'Auto Med', packQty: 2, unit: 'Pack', rate: 300, total: 600, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
      ]);
    });
    stored = JSON.parse(localStorage.getItem('lhcc_active_medicines')!);
    expect(stored[0].name).toBe('Auto Med');

    act(() => {
      result.current.setActiveTab('settings');
    });
    stored = JSON.parse(localStorage.getItem('lhcc_clinic_settings')!);
    expect(stored).toBeDefined();
  });
});
