const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('lhcc_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || `Request failed with status ${res.status}` };
    }

    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

async function requestFormData<T>(
  endpoint: string,
  method: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('lhcc_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || `Request failed with status ${res.status}` };
    }

    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ message: string; tempEmail: string; tempName: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  verifyRegistrationOtp: (name: string, email: string, password: string, otp: string) =>
    request<{ token: string; user: { id: string; name: string; email: string } }>(
      '/auth/verify-registration-otp',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password, otp }),
      },
    ),

  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; name: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  getMe: () =>
    request<{ user: { id: string; name: string; email: string } }>('/auth/me'),

  // Doctors
  getDoctors: () =>
    request<{ doctors: Array<{ _id: string; name: string; qualification: string; signature: string; seal: string }> }>('/doctors'),

  createDoctor: (data: { name: string; qualification?: string; signature?: File | null; seal?: File | null }) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.qualification) formData.append('qualification', data.qualification);
    if (data.signature instanceof File) formData.append('signature', data.signature);
    if (data.seal instanceof File) formData.append('seal', data.seal);
    return requestFormData<{ doctor: { _id: string; name: string; qualification: string; signature: string; seal: string } }>('/doctors', 'POST', formData);
  },

  updateDoctor: (id: string, data: { name?: string; qualification?: string; signature?: File | null; seal?: File | null }) => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.qualification) formData.append('qualification', data.qualification);
    if (data.signature instanceof File) formData.append('signature', data.signature);
    if (data.seal instanceof File) formData.append('seal', data.seal);
    return requestFormData<{ doctor: { _id: string; name: string; qualification: string; signature: string; seal: string } }>(`/doctors/${id}`, 'PUT', formData);
  },

  deleteDoctor: (id: string) =>
    request<{ message: string }>(`/doctors/${id}`, { method: 'DELETE' }),

  // Drafts
  getDrafts: () =>
    request<{ drafts: Array<{
      _id: string; patientInfo: Record<string, any>; medicines: Array<Record<string, any>>;
      createdAt: string; updatedAt: string;
    }> }>('/drafts'),

  saveDraft: (data: { draftId?: string; patientInfo: Record<string, any>; medicines: Array<Record<string, any>> }) =>
    request<{ draft: { _id: string; patientInfo: Record<string, any>; medicines: Array<Record<string, any>>; createdAt: string } }>('/drafts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteDraft: (id: string) =>
    request<{ message: string }>(`/drafts/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () =>
    request<{ settings: {
      _id: string; logo: string; name: string; address: string; phone: string;
      email: string; website: string; signature: string; footerText: string;
      selectedDoctorId: string;
    } | null }>('/settings'),

  upsertSettings: (data: {
    logo?: string; name?: string; address?: string; phone?: string;
    email?: string; website?: string; signature?: string; footerText?: string;
    selectedDoctorId?: string;
  }) =>
    request<{ settings: {
      _id: string; logo: string; name: string; address: string; phone: string;
      email: string; website: string; signature: string; footerText: string;
      selectedDoctorId: string;
    } }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
