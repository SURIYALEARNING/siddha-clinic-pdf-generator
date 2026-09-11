import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';

const mockUseClinic = vi.fn();
vi.mock('../../context/ClinicContext', () => ({
  useClinic: () => mockUseClinic(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { name: 'Dr. Test' } })),
}));

const defaultMocks = {
  patientInfo: { name: '', country: '', invoiceNo: 'INV-001', refNo: 'REF-001' },
  medicines: [],
  savedDrafts: [],
  loadDraft: vi.fn(),
  deleteDraft: vi.fn(),
  setActiveTab: vi.fn(),
  resetPatientForm: vi.fn(),
  loadingDrafts: false,
};

function setup(overrides = {}) {
  mockUseClinic.mockReturnValue({ ...defaultMocks, ...overrides });
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome banner with user name', () => {
    setup();
    expect(screen.getByText(/Dr\. Test/)).toBeInTheDocument();
  });

  it('renders empty state when no saved drafts', () => {
    setup();
    expect(screen.getByText('No Patient Records Yet')).toBeInTheDocument();
  });

  it('shows stats cards with correct values from patientInfo, medicines', () => {
    setup({
      patientInfo: { name: 'John Doe', country: 'India', invoiceNo: 'INV-001', refNo: 'REF-001' },
      medicines: [{ id: '1', name: 'MedA', packQty: 2, rate: 100, total: 200 }],
    });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('1 Items')).toBeInTheDocument();
    expect(screen.getByText('INR 200.00')).toBeInTheDocument();
  });

  it('shows "Register New Patient" button that resets form and navigates', () => {
    const setActiveTab = vi.fn();
    const resetPatientForm = vi.fn();
    setup({ setActiveTab, resetPatientForm });
    fireEvent.click(screen.getByText('Register New Patient'));
    expect(resetPatientForm).toHaveBeenCalled();
    expect(setActiveTab).toHaveBeenCalledWith('patient');
  });

  it('"Fill Details" button navigates to patient tab', () => {
    const setActiveTab = vi.fn();
    setup({ setActiveTab });
    fireEvent.click(screen.getByText('Fill Details'));
    expect(setActiveTab).toHaveBeenCalledWith('patient');
  });

  it('"Formula Entry" button navigates to medicines tab', () => {
    const setActiveTab = vi.fn();
    setup({ setActiveTab });
    fireEvent.click(screen.getByText('Formula Entry'));
    expect(setActiveTab).toHaveBeenCalledWith('medicines');
  });

  it('renders draft history table when drafts exist', () => {
    setup({
      savedDrafts: [
        {
          id: 'draft-1',
          patientInfo: { name: 'Jane Doe', invoiceNo: 'INV-002', country: 'USA' },
          medicines: [{ id: 'm1', name: 'MedX', packQty: 1, rate: 500, total: 500 }],
          createdAt: '2026-01-01',
        },
      ],
    });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('INV-002')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
  });

  it('draft rows show patient name, invoice number, country, med count, total cost', () => {
    setup({
      savedDrafts: [
        {
          id: 'draft-2',
          patientInfo: { name: 'Alice', invoiceNo: 'INV-003', country: 'UK' },
          medicines: [
            { id: 'm1', name: 'MedA', packQty: 2, rate: 100, total: 200 },
            { id: 'm2', name: 'MedB', packQty: 1, rate: 300, total: 300 },
          ],
          createdAt: '2026-02-01',
        },
      ],
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('INV-003')).toBeInTheDocument();
    expect(screen.getByText('UK')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getByText('INR 500.00')).toBeInTheDocument();
  });

  it('"Load" button on draft row calls loadDraft', () => {
    const loadDraft = vi.fn();
    setup({
      savedDrafts: [
        {
          id: 'draft-load',
          patientInfo: { name: 'Bob', invoiceNo: 'INV-004', country: 'Canada' },
          medicines: [{ id: 'm1', name: 'MedC', packQty: 1, rate: 100, total: 100 }],
          createdAt: '2026-03-01',
        },
      ],
      loadDraft,
    });
    fireEvent.click(screen.getByText('Load'));
    expect(loadDraft).toHaveBeenCalledWith('draft-load');
  });

  it('"Delete" button shows confirm dialog and calls deleteDraft', async () => {
    const deleteDraft = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    setup({
      savedDrafts: [
        {
          id: 'draft-del',
          patientInfo: { name: 'Charlie', invoiceNo: 'INV-005', country: 'Australia' },
          medicines: [{ id: 'm1', name: 'MedD', packQty: 1, rate: 100, total: 100 }],
          createdAt: '2026-04-01',
        },
      ],
      deleteDraft,
    });
    fireEvent.click(screen.getByTitle('Delete from local archive'));
    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    expect(deleteDraft).toHaveBeenCalledWith('draft-del');
    confirmSpy.mockRestore();
  });

  it('shows loading indicator when loadingDrafts is true', () => {
    setup({ loadingDrafts: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('empty medicines shows 0 items and INR 0.00', () => {
    setup();
    expect(screen.getByText('0 Items')).toBeInTheDocument();
    expect(screen.getByText('INR 0.00')).toBeInTheDocument();
  });

  it('paginates saved drafts when there are more than page size', () => {
    // Generate 25 drafts
    const drafts = Array.from({ length: 25 }, (_, i) => ({
      id: `draft-${i + 1}`,
      patientInfo: { name: `Patient ${i + 1}`, invoiceNo: `INV-${String(i + 1).padStart(3, '0')}`, country: 'India' },
      medicines: [{ id: `m-${i + 1}`, name: 'Med', packQty: 1, rate: 100, total: 100 }],
      createdAt: '2026-01-01',
    }));

    setup({ savedDrafts: drafts });

    // Page 1 should show Patient 1 and Patient 20, but not Patient 21
    expect(screen.getByText('Patient 1')).toBeInTheDocument();
    expect(screen.getByText('Patient 20')).toBeInTheDocument();
    expect(screen.queryByText('Patient 21')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    // Click next page
    fireEvent.click(screen.getByTitle('Next page'));

    // Now page 2 should show Patient 21 to Patient 25, and Patient 1 should not be visible
    expect(screen.getByText('Patient 21')).toBeInTheDocument();
    expect(screen.getByText('Patient 25')).toBeInTheDocument();
    expect(screen.queryByText('Patient 1')).not.toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('changes page size and adjusts pagination', () => {
    const drafts = Array.from({ length: 25 }, (_, i) => ({
      id: `draft-${i + 1}`,
      patientInfo: { name: `Patient ${i + 1}`, invoiceNo: `INV-${String(i + 1).padStart(3, '0')}`, country: 'India' },
      medicines: [{ id: `m-${i + 1}`, name: 'Med', packQty: 1, rate: 100, total: 100 }],
      createdAt: '2026-01-01',
    }));

    setup({ savedDrafts: drafts });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });

    // With 10 per page and 25 drafts, total pages is 3
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Patient 10')).toBeInTheDocument();
    expect(screen.queryByText('Patient 11')).not.toBeInTheDocument();
  });
});

