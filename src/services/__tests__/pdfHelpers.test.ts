import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../assets/logo.png', () => ({ default: 'logo.png' }));
vi.mock('../../assets/companyname.png', () => ({ default: 'companyname.png' }));
vi.mock('../../assets/footer.png', () => ({ default: 'footer.png' }));
vi.mock('../../assets/companyseel.png', () => ({ default: 'companyseel.png' }));

const createMockDoc = vi.hoisted(() => () => ({
  rect: vi.fn(),
  addPage: vi.fn(),
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  text: vi.fn(),
  addImage: vi.fn(),
  line: vi.fn(),
  getTextWidth: vi.fn(() => 20),
  splitTextToSize: vi.fn((text: string) => [text]),
  getImageProperties: vi.fn(() => ({ width: 100, height: 50 })),
  internal: { pageSize: { width: 210, height: 297, getWidth: () => 210, getHeight: () => 297 }, pages: [1, 2, 3] },
  setPage: vi.fn(),
}));

vi.mock('jspdf', () => {
  return { jsPDF: vi.fn(() => createMockDoc()), default: vi.fn(() => createMockDoc()) };
});

import {
  formatDateDisplay, getDoctorSeal, drawPageFooter, treatmentBillHeadterFooter,
  sealPage, drawTemplate, drawSignatureBlock, drawDocumentMetaAndToBlock, addPageFooters
} from '../pdfHelpers';
import type { Doctor, ClinicSettings, PatientInfo } from '../../types';

describe('formatDateDisplay', () => {
  it('formats a date string to DD-Mon-YYYY', () => {
    expect(formatDateDisplay('2024-01-15')).toBe('15-Jan-2024');
    expect(formatDateDisplay('2024-12-25')).toBe('25-Dec-2024');
    expect(formatDateDisplay('2024-03-01')).toBe('01-Mar-2024');
  });

  it('returns original string for invalid dates', () => {
    expect(formatDateDisplay('not-a-date')).toBe('not-a-date');
    expect(formatDateDisplay('')).toBe('');
  });

  it('handles single digit days and months', () => {
    expect(formatDateDisplay('2024-01-01')).toBe('01-Jan-2024');
    expect(formatDateDisplay('2024-06-05')).toBe('05-Jun-2024');
  });
});

describe('getDoctorSeal', () => {
  const doctors: Doctor[] = [
    { id: '1', name: 'Dr. A', qualification: 'B.S.M.S', signature: 'sig1', seal: 'seal1' },
    { id: '2', name: 'Dr. B', qualification: 'M.D.', signature: 'sig2', seal: '' },
  ];

  it('returns seal for selected doctor', () => {
    expect(getDoctorSeal(doctors, '1')).toBe('seal1');
  });

  it('returns companyseel when doctor has no seal', () => {
    const result = getDoctorSeal(doctors, '2');
    expect(result).toBeTruthy();
  });

  it('returns companyseel when doctor not found', () => {
    const result = getDoctorSeal(doctors, '999');
    expect(result).toBeTruthy();
  });

  it('returns companyseel when doctors list is empty', () => {
    const result = getDoctorSeal([], '1');
    expect(result).toBeTruthy();
  });
});

describe('drawPageFooter', () => {
  it('calls doc.text with page number info', () => {
    const doc = createMockDoc();
    drawPageFooter(doc, 1, 3);
    expect(doc.text).toHaveBeenCalledWith(
      'Page 1 of 3',
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: 'right' })
    );
  });

  it('sets font to times normal size 8.5', () => {
    const doc = createMockDoc();
    drawPageFooter(doc, 2, 5);
    expect(doc.setFont).toHaveBeenCalledWith('times', 'normal');
    expect(doc.setFontSize).toHaveBeenCalledWith(8.5);
    expect(doc.setTextColor).toHaveBeenCalledWith(0, 0, 0);
  });
});

describe('treatmentBillHeadterFooter', () => {
  it('draws border rect and header layout', () => {
    const doc = createMockDoc();
    treatmentBillHeadterFooter(doc, 100, 180);
    expect(doc.rect).toHaveBeenCalledWith(10, 9, 190, 279);
    expect(doc.addImage).toHaveBeenCalledTimes(2);
    expect(doc.line).toHaveBeenCalledWith(10, 56, 200, 56);
    expect(doc.line).toHaveBeenCalledWith(10, 265, 200, 265);
  });
});

describe('sealPage', () => {
  it('adds seal image when sealImage is provided', () => {
    const doc = createMockDoc();
    sealPage(doc, 100, 'data:image/png;base64,abc');
    expect(doc.addImage).toHaveBeenCalledWith(
      'data:image/png;base64,abc',
      expect.any(String),
      expect.any(Number),
      100,
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('uses default company seal when sealImage is not provided', () => {
    const doc = createMockDoc();
    sealPage(doc, 100);
    expect(doc.addImage).toHaveBeenCalledWith(
      'companyseel.png',
      expect.any(String),
      expect.any(Number),
      100,
      expect.any(Number),
      expect.any(Number)
    );
  });
});

describe('drawTemplate', () => {
  it('draws border rect and all template elements', () => {
    const doc = createMockDoc();
    drawTemplate(doc);
    expect(doc.rect).toHaveBeenCalledWith(10, 9, 190, 279);
    expect(doc.addImage).toHaveBeenCalledTimes(3);
    expect(doc.line).toHaveBeenCalledWith(10, 56, 200, 56);
    expect(doc.line).toHaveBeenCalledWith(10, 269, 200, 269);
  });
});

describe('drawSignatureBlock', () => {
  const settingsWithSig: ClinicSettings = {
    logo: '', name: '', address: '', phone: '', email: '', website: '',
    signature: 'sig.png', footerText: '', doctors: [], selectedDoctorId: '',
  };
  const settingsWithoutSig: ClinicSettings = { ...settingsWithSig, signature: '' };

  it('draws signature image when signature is present', () => {
    const doc = createMockDoc();
    drawSignatureBlock(doc, settingsWithSig, 200);
    expect(doc.addImage).toHaveBeenCalledWith(
      'sig.png', 'PNG', expect.any(Number), 200, expect.any(Number), expect.any(Number)
    );
  });

  it('does not call addImage when signature is empty', () => {
    const doc = createMockDoc();
    drawSignatureBlock(doc, settingsWithoutSig, 200);
    expect(doc.addImage).not.toHaveBeenCalled();
  });

  it('adds a new page when y + 30 exceeds pageHeight - 20', () => {
    const doc = createMockDoc();
    drawSignatureBlock(doc, settingsWithSig, 270);
    expect(doc.addPage).toHaveBeenCalled();
  });

  it('handles addImage error gracefully in drawSignatureBlock', () => {
    const doc = createMockDoc();
    doc.addImage = vi.fn(() => { throw new Error('Image error'); });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const settings: ClinicSettings = { ...settingsWithSig, signature: 'data:image/png;base64,bad' };
    drawSignatureBlock(doc, settings, 100);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('renders Authorized Signature text', () => {
    const doc = createMockDoc();
    drawSignatureBlock(doc, settingsWithSig, 200);
    expect(doc.text).toHaveBeenCalledWith(
      'Authorized Signature', expect.any(Number), expect.any(Number),
      expect.objectContaining({ align: 'right' })
    );
  });
});

describe('drawDocumentMetaAndToBlock', () => {
  const basePatient: PatientInfo = {
    name: 'John Doe', companyName: 'Acme Corp', address: '123 Main St', country: 'USA',
    phone: '+1234567890', passportId: 'P123456', date: '2024-01-15', invoiceNo: 'INV-001', refNo: 'REF-001',
  };

  it('renders ANNEXURE-1 title when isAnnexure is true', () => {
    const doc = createMockDoc();
    drawDocumentMetaAndToBlock(doc, basePatient, true, false, 65);
    expect(doc.text).toHaveBeenCalledWith(
      'ANNEXURE-1', expect.any(Number), expect.any(Number),
      expect.objectContaining({ align: 'center' })
    );
  });

  it('renders CASH BILL / INVOICE title when isBill is true', () => {
    const doc = createMockDoc();
    drawDocumentMetaAndToBlock(doc, basePatient, false, true, 65);
    expect(doc.text).toHaveBeenCalledWith(
      'CASH BILL / INVOICE', expect.any(Number), expect.any(Number),
      expect.objectContaining({ align: 'center' })
    );
  });

  it('renders TO WHOMSOEVER IT MAY CONCERN when both flags are false', () => {
    const doc = createMockDoc();
    drawDocumentMetaAndToBlock(doc, basePatient, false, false, 65);
    expect(doc.text).toHaveBeenCalledWith(
      'TO WHOMSOEVER IT MAY CONCERN', expect.any(Number), expect.any(Number),
      expect.objectContaining({ align: 'center' })
    );
  });

  it('renders companyName when provided', () => {
    const doc = createMockDoc();
    drawDocumentMetaAndToBlock(doc, basePatient, false, false, 65);
    expect(doc.text).toHaveBeenCalledWith('Acme Corp', expect.any(Number), expect.any(Number));
  });

  it('renders address when provided', () => {
    const doc = createMockDoc();
    drawDocumentMetaAndToBlock(doc, basePatient, false, false, 65);
    expect(doc.text).toHaveBeenCalledWith(['123 Main St'], expect.any(Number), expect.any(Number));
  });

  it('renders phone when provided', () => {
    const doc = createMockDoc();
    drawDocumentMetaAndToBlock(doc, basePatient, false, false, 65);
    expect(doc.text).toHaveBeenCalledWith('Phone No: +1234567890', expect.any(Number), expect.any(Number));
  });

  it('renders passport/ID when provided', () => {
    const doc = createMockDoc();
    drawDocumentMetaAndToBlock(doc, basePatient, false, false, 65);
    expect(doc.text).toHaveBeenCalledWith('Passport/ID: P123456', expect.any(Number), expect.any(Number));
  });

  it('omits optional fields when not provided', () => {
    const doc = createMockDoc();
    const minimalPatient: PatientInfo = {
      name: 'John Doe', companyName: '', address: '', country: 'USA',
      phone: '', passportId: '', date: '2024-01-15', invoiceNo: 'INV-001', refNo: 'REF-001',
    };
    drawDocumentMetaAndToBlock(doc, minimalPatient, false, false, 65);
    const textCalls = doc.text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls).not.toContain('Phone No: +1234567890');
    expect(textCalls).not.toContain('Passport/ID: P123456');
    expect(textCalls).not.toContain('Acme Corp');
  });
});

describe('addPageFooters', () => {
  it('calls setPage and drawPageFooter for each page', () => {
    const doc = createMockDoc();
    addPageFooters(doc);
    expect(doc.setPage).toHaveBeenCalledTimes(2);
    expect(doc.setPage).toHaveBeenCalledWith(1);
    expect(doc.setPage).toHaveBeenCalledWith(2);
    expect(doc.text).toHaveBeenCalledTimes(2);
  });
});
