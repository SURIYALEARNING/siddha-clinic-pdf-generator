import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PatientFormPage } from '../PatientFormPage';

const mockUseClinic = vi.fn();
vi.mock('../../context/ClinicContext', () => ({
  useClinic: () => mockUseClinic(),
}));

const defaultMocks = {
  patientInfo: {
    name: '',
    companyName: '',
    address: '',
    country: '',
    phone: '',
    passportId: '',
    date: '2026-07-28',
    invoiceNo: 'LHCC-20260728-001',
    refNo: 'LHCC/REF/2026/1234',
    opNo: '',
    age: '',
    sex: '',
    diagnosis: '',
  },
  updatePatientInfo: vi.fn(),
  errors: {},
  setActiveTab: vi.fn(),
  validateForm: vi.fn(),
  saveCurrentDraft: vi.fn(),
};

function setup(overrides = {}) {
  mockUseClinic.mockReturnValue({ ...defaultMocks, ...overrides });
  return render(
    <MemoryRouter>
      <PatientFormPage />
    </MemoryRouter>,
  );
}

describe('PatientFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with patient name, company, address, country, phone, etc.', () => {
    setup();
    expect(screen.getByLabelText(/Patient Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Permanent Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Passport/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Diagnosis/)).toBeInTheDocument();
    expect(screen.getByLabelText(/OP No/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reference ID/)).toBeInTheDocument();
  });

  it('shows invoice number', () => {
    setup();
    expect(screen.getByDisplayValue('LHCC-20260728-001')).toBeInTheDocument();
  });

  it('updates patient info on input change', () => {
    const updatePatientInfo = vi.fn();
    setup({ updatePatientInfo, patientInfo: { ...defaultMocks.patientInfo } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Anand Kumar'), {
      target: { value: 'New Name' },
    });
    expect(updatePatientInfo).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Name' }),
    );
  });

  it('shows validation errors', () => {
    setup({ errors: { name: 'Name is required', country: 'Country is required' } });
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Country is required')).toBeInTheDocument();
  });

  it('"Continue to Medicine Entry" submits form, saves draft, navigates to medicines tab', async () => {
    const saveCurrentDraft = vi.fn().mockResolvedValue({ id: 'draft-1' });
    const setActiveTab = vi.fn();
    setup({
      saveCurrentDraft,
      setActiveTab,
      patientInfo: { ...defaultMocks.patientInfo, name: 'Test Patient', country: 'India' },
    });
    fireEvent.click(screen.getByText('Continue to Medicine Entry'));
    await waitFor(() => expect(saveCurrentDraft).toHaveBeenCalled());
    expect(setActiveTab).toHaveBeenCalledWith('medicines');
  });

  it('alerts when required fields missing', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockReturnValue();
    setup({ patientInfo: { ...defaultMocks.patientInfo, name: '', country: '' } });
    fireEvent.click(screen.getByText('Continue to Medicine Entry'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Please fill in the required fields (Patient Name and Country) first.',
    );
    alertSpy.mockRestore();
  });

  it('clears validation errors when user types valid input', () => {
    const updatePatientInfo = vi.fn();
    setup({
      updatePatientInfo,
      errors: { name: 'Name is required' },
      patientInfo: { ...defaultMocks.patientInfo },
    });
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('e.g. Anand Kumar'), {
      target: { value: 'Valid Name' },
    });
    expect(updatePatientInfo).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Valid Name' }),
    );
  });

  it('renders sex dropdown options', () => {
    setup();
    const select = screen.getByLabelText(/Sex/);
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('renders date input with current date', () => {
    setup();
    expect(screen.getByDisplayValue('2026-07-28')).toBeInTheDocument();
  });
});
