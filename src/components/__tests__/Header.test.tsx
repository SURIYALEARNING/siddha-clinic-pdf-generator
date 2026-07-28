import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockSaveCurrentDraft = vi.fn();
const mockResetPatientForm = vi.fn();
const mockSetActiveTab = vi.fn();
const mockValidateForm = vi.fn();
const mockUseClinic = vi.fn();

vi.mock('../../context/ClinicContext', () => ({
  useClinic: (...args: any[]) => mockUseClinic(...args),
}));

import { Header } from '../Header';

function defaultMock() {
  return {
    activeTab: 'dashboard',
    patientInfo: { name: '' },
    medicines: [],
    saveCurrentDraft: mockSaveCurrentDraft,
    resetPatientForm: mockResetPatientForm,
    setActiveTab: mockSetActiveTab,
    validateForm: mockValidateForm,
  };
}

describe('Header', () => {
  let alertMock: any;
  let confirmMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClinic.mockReturnValue(defaultMock());
    alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    alertMock.mockRestore();
    confirmMock.mockRestore();
  });

  it('renders header with title based on activeTab', () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText('System Dashboard')).toBeInTheDocument();
  });

  it('shows patient badge when patientInfo.name exists', () => {
    mockUseClinic.mockReturnValue({ ...defaultMock(), patientInfo: { name: 'John Doe' } });
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText(/Active:/)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it('Save Draft button calls saveCurrentDraft', async () => {
    mockSaveCurrentDraft.mockResolvedValue({
      patientInfo: { name: 'Test', invoiceNo: 'INV-001' },
      medicines: [],
      id: 'draft-1',
      createdAt: new Date().toISOString(),
    });
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByTitle('Save to Drafts list'));
    expect(mockSaveCurrentDraft).toHaveBeenCalled();
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });
  });

  it('New Patient button shows confirm dialog, then resets form', async () => {
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByTitle('Reset form for new patient'));
    expect(confirmMock).toHaveBeenCalled();
    expect(mockResetPatientForm).toHaveBeenCalled();
    expect(mockSetActiveTab).toHaveBeenCalledWith('patient');
  });

  it('Generate PDFs button validates form and navigates to preview', async () => {
    mockValidateForm.mockReturnValue(true);
    mockSaveCurrentDraft.mockResolvedValue({
      patientInfo: { name: 'Test', invoiceNo: 'INV-001' },
      medicines: [],
      id: 'draft-1',
      createdAt: new Date().toISOString(),
    });
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByText('Generate PDFs'));
    expect(mockValidateForm).toHaveBeenCalled();
    expect(mockSaveCurrentDraft).toHaveBeenCalled();
    expect(mockSetActiveTab).toHaveBeenCalledWith('preview');
  });

  it('Generate PDFs button shows alert when validation fails', async () => {
    mockValidateForm.mockReturnValue(false);
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByText('Generate PDFs'));
    expect(alertMock).toHaveBeenCalledWith(
      'Please fix the validation errors in Patient Information and Medicine Entry first.',
    );
  });

  it('mobile toggle button calls onToggleSidebar', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Header onToggleSidebar={onToggle} />);
    await user.click(screen.getByLabelText('Toggle sidebar'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('truncates long titles', () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    const title = screen.getByText('System Dashboard');
    expect(title.className).toContain('truncate');
  });

  it('renders Patient Registration title', () => {
    mockUseClinic.mockReturnValue({ ...defaultMock(), activeTab: 'patient' });
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText('Patient Registration')).toBeInTheDocument();
  });

  it('renders Medicine Formula title', () => {
    mockUseClinic.mockReturnValue({ ...defaultMock(), activeTab: 'medicines' });
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText('Medicine Formula & Dosage')).toBeInTheDocument();
  });

  it('renders Document Hub title', () => {
    mockUseClinic.mockReturnValue({ ...defaultMock(), activeTab: 'preview' });
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText('Document Hub & PDF Previews')).toBeInTheDocument();
  });

  it('renders Clinic Profile title', () => {
    mockUseClinic.mockReturnValue({ ...defaultMock(), activeTab: 'settings' });
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText('Clinic Profile Configuration')).toBeInTheDocument();
  });

  it('renders default title for unknown tab', () => {
    mockUseClinic.mockReturnValue({ ...defaultMock(), activeTab: 'unknown' as any });
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText('Siddha Clinic Admin')).toBeInTheDocument();
  });

  it('New Patient button does not reset when confirm is cancelled', async () => {
    confirmMock.mockReturnValue(false);
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByTitle('Reset form for new patient'));
    expect(confirmMock).toHaveBeenCalled();
    expect(mockResetPatientForm).not.toHaveBeenCalled();
    expect(mockSetActiveTab).not.toHaveBeenCalled();
  });
});
