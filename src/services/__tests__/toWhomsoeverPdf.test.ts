import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ClinicSettings, PatientInfo } from '../../types';

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

vi.mock('../../assets/logo.png', () => ({ default: 'logo.png' }));
vi.mock('../../assets/companyname.png', () => ({ default: 'companyname.png' }));
vi.mock('../../assets/footer.png', () => ({ default: 'footer.png' }));
vi.mock('../../assets/companyseel.png', () => ({ default: 'companyseel.png' }));

import { generateToWhomsoeverPdf } from '../toWhomsoeverPdf';

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
});

describe('generateToWhomsoeverPdf', () => {
  it('returns a Blob', () => {
    const result = generateToWhomsoeverPdf(mockPatient, mockSettings);
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls the jsPDF constructor (verified via output)', () => {
    generateToWhomsoeverPdf(mockPatient, mockSettings);
    expect(mockDocRef.current.output).toHaveBeenCalledWith('blob');
  });

  it('renders patient name and document title', () => {
    generateToWhomsoeverPdf(mockPatient, mockSettings);
    expect(mockDocRef.current.text).toHaveBeenCalledWith(
      'TO WHOM SO EVER IT MAY CONCERN',
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: 'center' })
    );
    expect(mockDocRef.current.text).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('JOHN DOE')]),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('handles missing patient fields', () => {
    const minimalPatient: PatientInfo = {
      name: 'Jane Smith', companyName: '', address: '', country: 'Canada',
      phone: '', passportId: '', date: '2024-06-01', invoiceNo: 'INV-002', refNo: 'REF-002',
    };
    const result = generateToWhomsoeverPdf(minimalPatient, mockSettings);
    expect(result).toBeInstanceOf(Blob);
  });

  it('uses doctor seal when available', () => {
    const settingsWithSeal: ClinicSettings = {
      ...mockSettings,
      doctors: [{ id: 'doc1', name: 'Dr. Test', qualification: 'B.S.M.S', signature: '', seal: 'data:image/png;base64,sealimg' }],
    };
    generateToWhomsoeverPdf(mockPatient, settingsWithSeal);
    expect(mockDocRef.current.addImage).toHaveBeenCalledWith(
      'data:image/png;base64,sealimg',
      expect.any(String),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    );
  });
});
