import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

const mockUseClinic = vi.fn();

vi.mock('../context/ClinicContext', () => ({
  useClinic: (...args: any[]) => mockUseClinic(...args),
  ClinicProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../services/api', () => ({
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

vi.mock('../pages/DashboardPage', () => ({
  DashboardPage: () => <div>Dashboard Page</div>,
}));
vi.mock('../pages/PatientFormPage', () => ({
  PatientFormPage: () => <div>Patient Form Page</div>,
}));
vi.mock('../pages/MedicineEntryPage', () => ({
  MedicineEntryPage: () => <div>Medicine Entry Page</div>,
}));
vi.mock('../pages/PreviewPage', () => ({
  PreviewPage: () => <div>Preview Page</div>,
}));
vi.mock('../pages/SettingsPage', () => ({
  SettingsPage: () => <div>Settings Page</div>,
}));

vi.mock('../components/Sidebar', () => ({
  Sidebar: () => <div>Sidebar Component</div>,
}));
vi.mock('../components/Header', () => ({
  Header: () => <div>Header Component</div>,
}));

const baseClinicMock = {
  activeTab: 'dashboard',
  setActiveTab: vi.fn(),
  patientInfo: { name: '' },
  medicines: [],
  saveCurrentDraft: vi.fn(),
  resetPatientForm: vi.fn(),
  validateForm: vi.fn(),
  settings: { name: '', logo: '', address: '', phone: '', email: '', website: '', signature: '', footerText: '', doctors: [], selectedDoctorId: '' },
  updateSettings: vi.fn(),
  selectDoctor: vi.fn(),
  updatePatientInfo: vi.fn(),
  updateMedicines: vi.fn(),
  loadDraft: vi.fn(),
  deleteDraft: vi.fn(),
  savedDrafts: [],
  errors: {},
  clearErrors: vi.fn(),
  addDoctor: vi.fn(),
  removeDoctor: vi.fn(),
  loadingDoctors: false,
  loadingDrafts: false,
  paymentOnline: 0,
  paymentCash: 0,
  setPaymentOnline: vi.fn(),
  setPaymentCash: vi.fn(),
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClinic.mockReturnValue({ ...baseClinicMock });
  });

  it('renders without crashing', () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('uses ClinicProvider wrapper', () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('renders Sidebar and Header', () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Sidebar Component')).toBeInTheDocument();
    expect(screen.getByText('Header Component')).toBeInTheDocument();
  });

  it('renders DashboardPage when activeTab=dashboard', () => {
    mockUseClinic.mockReturnValue({ ...baseClinicMock, activeTab: 'dashboard' });
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('renders PatientFormPage when activeTab=patient', () => {
    mockUseClinic.mockReturnValue({ ...baseClinicMock, activeTab: 'patient' });
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Patient Form Page')).toBeInTheDocument();
  });

  it('renders MedicineEntryPage when activeTab=medicines', () => {
    mockUseClinic.mockReturnValue({ ...baseClinicMock, activeTab: 'medicines' });
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Medicine Entry Page')).toBeInTheDocument();
  });

  it('renders PreviewPage when activeTab=preview', () => {
    mockUseClinic.mockReturnValue({ ...baseClinicMock, activeTab: 'preview' });
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Preview Page')).toBeInTheDocument();
  });

  it('renders SettingsPage when activeTab=settings', () => {
    mockUseClinic.mockReturnValue({ ...baseClinicMock, activeTab: 'settings' });
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Settings Page')).toBeInTheDocument();
  });

  it('defaults to DashboardPage for unknown tab', () => {
    mockUseClinic.mockReturnValue({ ...baseClinicMock, activeTab: 'unknown' as any });
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
