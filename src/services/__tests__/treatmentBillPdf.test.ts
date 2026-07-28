import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ClinicSettings, PatientInfo, MedicineItem } from '../../types';

const mockDocRef = vi.hoisted(() => ({ current: null as any }));

vi.mock('jspdf', () => {
  const mockDoc = {
    internal: { pageSize: { width: 210, height: 297, getWidth: () => 210, getHeight: () => 297 }, pages: [1] },
    addImage: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    line: vi.fn(),
    rect: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    setPage: vi.fn(),
    getTextWidth: vi.fn(() => 30),
    splitTextToSize: vi.fn((text: string) => [text]),
    getImageProperties: vi.fn(() => ({ width: 100, height: 50 })),
    output: vi.fn(() => new Blob()),
  };
  mockDocRef.current = mockDoc;
  return { default: vi.fn().mockImplementation(function() { return mockDoc; }), jsPDF: vi.fn().mockImplementation(function() { return mockDoc; }) };
});

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

vi.mock('../../assets/logo.png', () => ({ default: 'logo.png' }));
vi.mock('../../assets/companyname.png', () => ({ default: 'companyname.png' }));
vi.mock('../../assets/footer.png', () => ({ default: 'footer.png' }));
vi.mock('../../assets/companyseel.png', () => ({ default: 'companyseel.png' }));

vi.mock('../../utils/numberToWords', () => ({ numberToWords: vi.fn(() => 'INR One Hundred Only') }));

import { generateTreatmentBillPdf } from '../treatmentBillPdf';
import autoTable from 'jspdf-autotable';

const mockPatient: PatientInfo = {
  name: 'John Doe',
  companyName: 'Acme Corp',
  address: '123 Main St',
  country: 'USA',
  phone: '+1234567890',
  passportId: 'P123456',
  date: '2024-01-15',
  invoiceNo: 'INV-001',
  refNo: 'REF-001',
  opNo: 'OP-001',
  age: '30',
  sex: 'Male',
  diagnosis: 'General',
};

const mockMedicines: MedicineItem[] = [
  {
    id: '1', name: 'Medicine A', packQty: 2, unit: 'Bottle', rate: 150, total: 300,
    morning: '1', noon: '1', night: '1', foodInstruction: 'After food', remarks: 'Take with water',
    quantityLabel: '2 Bottle',
  },
  {
    id: '2', name: 'Medicine B', packQty: 1, unit: 'Strip', rate: 200, total: 200,
    morning: '1', noon: '0', night: '1', foodInstruction: 'Before food', remarks: '',
  },
];

const mockSettings: ClinicSettings = {
  logo: 'logo.png',
  name: 'Test Clinic',
  address: 'Test Address',
  phone: '1234567890',
  email: 'test@test.com',
  website: 'test.com',
  signature: 'sig.png',
  footerText: 'Thanks',
  doctors: [{ id: 'doc1', name: 'Dr. Test', qualification: 'B.S.M.S', signature: '', seal: '' }],
  selectedDoctorId: 'doc1',
};

beforeEach(() => {
  vi.clearAllMocks();
  (autoTable as any).mockImplementation((doc: any) => {
    doc.lastAutoTable = { finalY: 200 };
  });
});

describe('generateTreatmentBillPdf', () => {
  it('returns a Blob', () => {
    const result = generateTreatmentBillPdf(mockPatient, mockMedicines, mockSettings);
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls the jsPDF constructor (verified via output)', () => {
    generateTreatmentBillPdf(mockPatient, mockMedicines, mockSettings);
    expect(mockDocRef.current.output).toHaveBeenCalledWith('blob');
  });

  it('renders patient details', () => {
    generateTreatmentBillPdf(mockPatient, mockMedicines, mockSettings);
    expect(mockDocRef.current.text).toHaveBeenCalledWith('John Doe', expect.any(Number), expect.any(Number));
    expect(mockDocRef.current.text).toHaveBeenCalledWith('TREATMENT BILL', expect.any(Number), expect.any(Number), expect.objectContaining({ align: 'center' }));
  });

  it('handles empty medicines array', () => {
    const result = generateTreatmentBillPdf(mockPatient, [], mockSettings);
    expect(result).toBeInstanceOf(Blob);
  });

  it('handles missing patient fields', () => {
    const minimalPatient: PatientInfo = {
      name: 'John Doe', companyName: '', address: '', country: 'USA',
      phone: '', passportId: '', date: '2024-01-15', invoiceNo: 'INV-001', refNo: 'REF-001',
    };
    const result = generateTreatmentBillPdf(minimalPatient, mockMedicines, mockSettings);
    expect(result).toBeInstanceOf(Blob);
  });

  it('adds a new page when content overflows', () => {
    (autoTable as any).mockImplementation((doc: any) => {
      doc.lastAutoTable = { finalY: 260 };
    });
    generateTreatmentBillPdf(mockPatient, mockMedicines, mockSettings);
    expect(mockDocRef.current.addPage).toHaveBeenCalled();
  });

  it('uses doctor seal when available', () => {
    const settingsWithSeal: ClinicSettings = {
      ...mockSettings,
      doctors: [{ id: 'doc1', name: 'Dr. Test', qualification: 'B.S.M.S', signature: '', seal: 'data:image/png;base64,sealimg' }],
    };
    generateTreatmentBillPdf(mockPatient, mockMedicines, settingsWithSeal);
    expect(mockDocRef.current.addImage).toHaveBeenCalledWith(
      'data:image/png;base64,sealimg',
      expect.any(String),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('calls drawTemplate via didDrawPage callback on subsequent pages', () => {
    let capturedDidDrawPage: ((data: { pageNumber: number }) => void) | undefined;
    (autoTable as any).mockImplementation((doc: any, options?: any) => {
      capturedDidDrawPage = options?.didDrawPage;
      doc.lastAutoTable = { finalY: 200 };
    });
    generateTreatmentBillPdf(mockPatient, mockMedicines, mockSettings);
    expect(capturedDidDrawPage).toBeDefined();
    capturedDidDrawPage!({ pageNumber: 2 });
    expect(mockDocRef.current.rect).toHaveBeenCalledWith(10, 9, 190, 279);
  });

  it('renders payment mode details with provided values', () => {
    generateTreatmentBillPdf(mockPatient, mockMedicines, mockSettings, 1500, 2000);
    expect(mockDocRef.current.text).toHaveBeenCalledWith(
      expect.stringContaining('Payment Mode Online: 1,500.00'),
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockDocRef.current.text).toHaveBeenCalledWith(
      expect.stringContaining('Payment Mode Cash: 2,000.00'),
      expect.any(Number),
      expect.any(Number)
    );
  });
});
