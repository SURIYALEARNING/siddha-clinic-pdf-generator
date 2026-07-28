import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MedicineEntryPage } from '../MedicineEntryPage';

const mockUseClinic = vi.fn();
vi.mock('../../context/ClinicContext', () => ({
  useClinic: () => mockUseClinic(),
}));

const defaultMocks = {
  medicines: [],
  updateMedicines: vi.fn(),
  errors: {},
  setActiveTab: vi.fn(),
  validateForm: vi.fn(() => true),
  saveCurrentDraft: vi.fn().mockResolvedValue({ id: 'draft-1' }),
  paymentOnline: 0,
  paymentCash: 0,
  setPaymentOnline: vi.fn(),
  setPaymentCash: vi.fn(),
};

function setup(overrides = {}) {
  mockUseClinic.mockReturnValue({ ...defaultMocks, ...overrides });
  return render(
    <MemoryRouter>
      <MedicineEntryPage />
    </MemoryRouter>,
  );
}

describe('MedicineEntryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no medicines', () => {
    setup();
    expect(screen.getByText('The Medicine Table is empty')).toBeInTheDocument();
  });

  it('"Add Medicine" button adds a new row', () => {
    const updateMedicines = vi.fn();
    setup({ updateMedicines, medicines: [] });
    fireEvent.click(screen.getByText('Add Medicine'));
    expect(updateMedicines).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: '', packQty: 1, rate: 100 })]),
    );
  });

  it('typing in medicine name field updates it', () => {
    const updateMedicines = vi.fn();
    const meds = [{ id: 'm1', name: '', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ updateMedicines, medicines: meds });
    const inputs = screen.getAllByPlaceholderText('Herbal formulation...');
    fireEvent.change(inputs[0], { target: { value: 'Nilavembu' } });
    expect(updateMedicines).toHaveBeenCalled();
  });

  it('typing in packQty or rate recalculates total', () => {
    const updateMedicines = vi.fn();
    const meds = [{ id: 'm1', name: 'MedA', packQty: 2, unit: 'Bottles', rate: 100, total: 200, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ updateMedicines, medicines: meds });
    const qtyInputs = screen.getAllByDisplayValue('2');
    fireEvent.change(qtyInputs[0], { target: { value: '3' } });
    expect(updateMedicines).toHaveBeenCalled();
  });

  it('changing total recalculates rate', () => {
    const updateMedicines = vi.fn();
    const meds = [{ id: 'm1', name: 'MedA', packQty: 2, unit: 'Bottles', rate: 100, total: 200, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ updateMedicines, medicines: meds });
    const totalInput = screen.getByDisplayValue('200');
    fireEvent.change(totalInput, { target: { value: '400' } });
    expect(updateMedicines).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'm1', total: 400, rate: 200 }),
      ]),
    );
  });

  it('"Delete Row" removes a medicine row', () => {
    const updateMedicines = vi.fn();
    const meds = [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ updateMedicines, medicines: meds });
    fireEvent.click(screen.getByTitle('Delete Row'));
    expect(updateMedicines).toHaveBeenCalledWith([]);
  });

  it('"Duplicate Row" creates a copy below current row', () => {
    const updateMedicines = vi.fn();
    const meds = [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ updateMedicines, medicines: meds });
    fireEvent.click(screen.getByTitle('Duplicate Row'));
    expect(updateMedicines).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'm1', name: 'MedA' }),
        expect.objectContaining({ name: 'MedA (Copy)' }),
      ]),
    );
  });

  it('"Move Up" / "Move Down" reorders rows', () => {
    const updateMedicines = vi.fn();
    const meds = [
      { id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
      { id: 'm2', name: 'MedB', packQty: 1, unit: 'Bottles', rate: 200, total: 200, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
    ];
    setup({ updateMedicines, medicines: meds });
    const upButtons = screen.getAllByTitle('Move Row Up');
    const downButtons = screen.getAllByTitle('Move Row Down');
    expect(upButtons[0]).toBeDisabled();
    expect(downButtons[1]).toBeDisabled();
    fireEvent.click(downButtons[0]);
    expect(updateMedicines).toHaveBeenCalled();
    fireEvent.click(upButtons[1]);
    expect(updateMedicines).toHaveBeenCalled();
  });

  it('shows validation errors for each row', () => {
    setup({
      errors: { med_name_0: 'Medicine Name is required.', med_rate_0: 'Rate must be a positive number.' },
      medicines: [{ id: 'm1', name: '', packQty: 1, unit: 'Bottles', rate: 0, total: 0, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }],
    });
    expect(screen.getByText('Medicine Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Rate must be a positive number.')).toBeInTheDocument();
  });

  it('shows error banner when errors.medicines is set', () => {
    setup({
      errors: { medicines: 'At least one medicine is required.' },
      medicines: [],
    });
    expect(screen.getByText('At least one medicine is required.')).toBeInTheDocument();
  });

  it('grand total displays correct sum of all totals', () => {
    const meds = [
      { id: 'm1', name: 'MedA', packQty: 2, unit: 'Bottles', rate: 100, total: 200, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
      { id: 'm2', name: 'MedB', packQty: 1, unit: 'Bottles', rate: 300, total: 300, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' },
    ];
    setup({ medicines: meds });
    expect(screen.getByText('INR 500.00')).toBeInTheDocument();
  });

  it('payment online/cash inputs update correctly', () => {
    const setPaymentOnline = vi.fn();
    const setPaymentCash = vi.fn();
    const meds = [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ medicines: meds, setPaymentOnline, setPaymentCash });
    const onlineInputs = screen.getAllByDisplayValue('0');
    const paymentOnlineInput = onlineInputs[onlineInputs.length - 2];
    fireEvent.change(paymentOnlineInput, { target: { value: '50' } });
    expect(setPaymentOnline).toHaveBeenCalledWith(50);
  });

  it('changing online payment updates cash to grandTotal - online', () => {
    const setPaymentOnline = vi.fn();
    const setPaymentCash = vi.fn();
    const meds = [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 500, total: 500, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ medicines: meds, setPaymentOnline, setPaymentCash, paymentOnline: 0, paymentCash: 500 });
    const spinbuttons = screen.getAllByRole('spinbutton');
    const onlineInput = spinbuttons[spinbuttons.length - 2];
    fireEvent.change(onlineInput, { target: { value: '200' } });
    expect(setPaymentOnline).toHaveBeenCalledWith(200);
    expect(setPaymentCash).toHaveBeenCalledWith(300);
  });

  it('changing cash payment updates online to grandTotal - cash', () => {
    const setPaymentOnline = vi.fn();
    const setPaymentCash = vi.fn();
    const meds = [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 500, total: 500, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ medicines: meds, setPaymentOnline, setPaymentCash, paymentOnline: 500, paymentCash: 0 });
    const spinbuttons = screen.getAllByRole('spinbutton');
    const cashInput = spinbuttons[spinbuttons.length - 1];
    fireEvent.change(cashInput, { target: { value: '200' } });
    expect(setPaymentCash).toHaveBeenCalledWith(200);
    expect(setPaymentOnline).toHaveBeenCalledWith(300);
  });

  it('shows alert when next step validation fails', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    setup({
      validateForm: vi.fn(() => false),
      medicines: [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }],
    });
    fireEvent.click(screen.getByText('Compile PDF Documents'));
    expect(alertMock).toHaveBeenCalledWith('Please resolve validation errors in the medicine table before compiling PDFs.');
    alertMock.mockRestore();
  });

  it('"Compile PDF Documents" button validates and navigates', async () => {
    const validateForm = vi.fn(() => true);
    const saveCurrentDraft = vi.fn().mockResolvedValue({ id: 'draft-1' });
    const setActiveTab = vi.fn();
    const meds = [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ medicines: meds, validateForm, saveCurrentDraft, setActiveTab });
    fireEvent.click(screen.getByText('Compile PDF Documents'));
    await waitFor(() => expect(validateForm).toHaveBeenCalled());
    expect(saveCurrentDraft).toHaveBeenCalled();
    expect(setActiveTab).toHaveBeenCalledWith('preview');
  });

  it('"Back to Demographics" button navigates to patient tab', () => {
    const setActiveTab = vi.fn();
    setup({ setActiveTab, medicines: [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }] });
    fireEvent.click(screen.getByText('Back to Demographics'));
    expect(setActiveTab).toHaveBeenCalledWith('patient');
  });

  it('shows total summary section when medicines exist', () => {
    const meds = [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }];
    setup({ medicines: meds });
    expect(screen.getByText('Subtotal Invoice Value')).toBeInTheDocument();
    expect(screen.getByText('Mode of Payment')).toBeInTheDocument();
  });

  it('medicine dropdown (datalist) suggests common medicines', () => {
    setup({ medicines: [{ id: 'm1', name: 'MedA', packQty: 1, unit: 'Bottles', rate: 100, total: 100, morning: '1', noon: '0', night: '1', foodInstruction: 'After Food', remarks: '' }] });
    const datalist = document.getElementById('siddha-medicines');
    expect(datalist).toBeInTheDocument();
    expect(datalist?.children.length).toBeGreaterThan(0);
  });
});
