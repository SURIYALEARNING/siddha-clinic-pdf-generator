import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../api';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
});

function mockResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  });
}

describe('api', () => {
  describe('auth endpoints', () => {
    it('register sends correct request', async () => {
      mockFetch.mockReturnValue(mockResponse({ message: 'OTP sent' }));
      const res = await api.register('Test', 'test@test.com', 'password123');
      expect(res.data?.message).toBe('OTP sent');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test', email: 'test@test.com', password: 'password123' }),
        }),
      );
    });

    it('login stores no token on success', async () => {
      mockFetch.mockReturnValue(mockResponse({ token: 'abc123', user: { id: '1', name: 'Test', email: 'test@test.com' } }));
      await api.login('test@test.com', 'pass');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('forgotPassword sends correct request', async () => {
      mockFetch.mockReturnValue(mockResponse({ message: 'OTP sent' }));
      const res = await api.forgotPassword('test@test.com');
      expect(res.data?.message).toBe('OTP sent');
    });

    it('resetPassword sends correct request', async () => {
      mockFetch.mockReturnValue(mockResponse({ message: 'Password reset' }));
      const res = await api.resetPassword('test@test.com', '123456', 'newpass123');
      expect(res.data?.message).toBe('Password reset');
    });

    it('getMe includes auth header when token exists', async () => {
      localStorage.setItem('lhcc_token', 'test-token');
      mockFetch.mockReturnValue(mockResponse({ user: { id: '1', name: 'T', email: 't@t.com' } }));
      await api.getMe();
      const callHeaders = (mockFetch.mock.calls[0][1] as any).headers;
      expect(callHeaders['Authorization']).toBe('Bearer test-token');
    });
  });

  describe('doctor endpoints', () => {
    it('getDoctors returns doctors list', async () => {
      const doctors = [{ _id: '1', name: 'Dr. A', qualification: 'B.S.M.S', signature: '', seal: '' }];
      mockFetch.mockReturnValue(mockResponse({ doctors }));
      const res = await api.getDoctors();
      expect(res.data?.doctors).toHaveLength(1);
    });

    it('createDoctor sends FormData', async () => {
      mockFetch.mockReturnValue(mockResponse({ doctor: { _id: '1', name: 'Dr. A', qualification: 'B.S.M.S', signature: '', seal: '' } }));
      const res = await api.createDoctor({ name: 'Dr. A', qualification: 'B.S.M.S' });
      expect(res.data?.doctor.name).toBe('Dr. A');
    });

    it('createDoctor sends FormData with file fields', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ doctor: { _id: '1', name: 'Dr. A', qualification: 'B.S.M.S', signature: 'sig', seal: 'seal' } }),
      }));
      const fileSig = new File(['sig'], 'sig.png', { type: 'image/png' });
      const fileSeal = new File(['seal'], 'seal.png', { type: 'image/png' });
      const res = await api.createDoctor({ name: 'Dr. A', signature: fileSig, seal: fileSeal });
      expect(res.data?.doctor.name).toBe('Dr. A');
    });

    it('deleteDoctor sends DELETE', async () => {
      mockFetch.mockReturnValue(mockResponse({ message: 'Doctor deleted' }));
      const res = await api.deleteDoctor('123');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/doctors/123'), expect.objectContaining({ method: 'DELETE' }));
      expect(res.data?.message).toBe('Doctor deleted');
    });
  });

  describe('draft endpoints', () => {
    it('getDrafts returns drafts list', async () => {
      const drafts = [{ _id: '1', patientInfo: { name: 'Patient' }, medicines: [] }];
      mockFetch.mockReturnValue(mockResponse({ drafts }));
      const res = await api.getDrafts();
      expect(res.data?.drafts).toHaveLength(1);
    });

    it('saveDraft sends POST with JSON body', async () => {
      const draftData = { patientInfo: { name: 'P' }, medicines: [] };
      mockFetch.mockReturnValue(mockResponse({ draft: { _id: '1', ...draftData } }));
      const res = await api.saveDraft(draftData);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/drafts'), expect.objectContaining({ method: 'POST' }));
      expect(res.data?.draft._id).toBe('1');
    });

    it('deleteDraft sends DELETE', async () => {
      mockFetch.mockReturnValue(mockResponse({ message: 'Draft deleted' }));
      const res = await api.deleteDraft('abc');
      expect(res.data?.message).toBe('Draft deleted');
    });
  });

  describe('settings endpoints', () => {
    it('getSettings returns settings', async () => {
      const settings = { _id: '1', name: 'Clinic', logo: '', address: '', phone: '', email: '', website: '', signature: '', footerText: '', selectedDoctorId: '' };
      mockFetch.mockReturnValue(mockResponse({ settings }));
      const res = await api.getSettings();
      expect(res.data?.settings?.name).toBe('Clinic');
    });

    it('upsertSettings sends PUT', async () => {
      const data = { name: 'New Clinic', address: '123 St' };
      mockFetch.mockReturnValue(mockResponse({ settings: { _id: '1', ...data, logo: '', phone: '', email: '', website: '', signature: '', footerText: '', selectedDoctorId: '' } }));
      const res = await api.upsertSettings(data);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/settings'), expect.objectContaining({ method: 'PUT' }));
      expect(res.data?.settings?.name).toBe('New Clinic');
    });
  });

  it('returns fallback error on non-ok response without data.error', async () => {
    mockFetch.mockReturnValue(Promise.resolve({
      ok: false, status: 500,
      json: () => Promise.resolve({}),
    }));
    const res = await api.getDoctors();
    expect(res.error).toContain('Request failed with status 500');
  });

  describe('FormData error handling', () => {
    it('returns network error on FormData fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('FormData network error'));
      const res = await api.createDoctor({ name: 'Dr. A' });
      expect(res.error).toBe('FormData network error');
    });

    it('returns error on non-ok FormData response', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Bad request' }),
      }));
      const res = await api.createDoctor({ name: 'Dr. A' });
      expect(res.error).toBe('Bad request');
    });

    it('returns generic error on non-ok FormData response without error message', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      }));
      const res = await api.createDoctor({ name: 'Dr. A' });
      expect(res.error).toContain('Request failed with status');
    });

    it('updateDoctor sends PUT with FormData', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ doctor: { _id: '1', name: 'Dr. Updated' } }),
      }));
      const res = await api.updateDoctor('1', { name: 'Dr. Updated' });
      expect(res.data?.doctor.name).toBe('Dr. Updated');
    });

    it('updateDoctor sends FormData with file fields', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ doctor: { _id: '1', name: 'Dr. A', signature: 'sig', seal: 'seal' } }),
      }));
      const fileSig = new File(['sig'], 'sig.png', { type: 'image/png' });
      const fileSeal = new File(['seal'], 'seal.png', { type: 'image/png' });
      const res = await api.updateDoctor('1', { name: 'Dr. A', signature: fileSig, seal: fileSeal });
      expect(res.data?.doctor.name).toBe('Dr. A');
    });

    it('createDoctor includes auth header with FormData when token exists', async () => {
      localStorage.setItem('lhcc_token', 'test-token');
      mockFetch.mockReturnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ doctor: { _id: '1', name: 'Dr. A' } }),
      }));
      await api.createDoctor({ name: 'Dr. A' });
      const callHeaders = (mockFetch.mock.calls[0][1] as any).headers;
      expect(callHeaders['Authorization']).toBe('Bearer test-token');
    });

    it('request without token does not include auth header', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: '1', name: 'T', email: 't@t.com' } }),
      }));
      await api.getMe();
      const callHeaders = (mockFetch.mock.calls[0][1] as any).headers;
      expect(callHeaders['Authorization']).toBeUndefined();
    });

    it('requestFormData without token does not include auth header', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ doctor: { _id: '1', name: 'Dr. A' } }),
      }));
      await api.createDoctor({ name: 'Dr. A' });
      const callHeaders = (mockFetch.mock.calls[0][1] as any).headers;
      expect(callHeaders['Authorization']).toBeUndefined();
    });

    it('returns generic network error when non-Error thrown from request', async () => {
      mockFetch.mockRejectedValue('string error');
      const res = await api.getDrafts();
      expect(res.error).toBe('Network error');
    });

    it('returns generic network error when non-Error thrown from FormData request', async () => {
      mockFetch.mockRejectedValue('string error');
      const res = await api.createDoctor({ name: 'Dr. A' });
      expect(res.error).toBe('Network error');
    });

    it('returns fallback error on non-ok response without data.error', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: false, status: 500,
        json: () => Promise.resolve({}),
      }));
      const res = await api.getDoctors();
      expect(res.error).toContain('Request failed with status 500');
    });

    it('verifyRegistrationOtp sends correct request', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'xyz', user: { id: '1', name: 'T', email: 't@t.com' } }),
      }));
      const res = await api.verifyRegistrationOtp('Test', 'test@test.com', 'pass123', '123456');
      expect(res.data?.token).toBe('xyz');
    });
  });
});
