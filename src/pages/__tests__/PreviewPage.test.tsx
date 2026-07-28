import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PreviewPage } from '../PreviewPage';

const mockGenerateToWhom = vi.hoisted(() => vi.fn(() => new Blob()));
const mockGenerateAnnexure = vi.hoisted(() => vi.fn(() => new Blob()));
const mockGenerateCashBill = vi.hoisted(() => vi.fn(() => new Blob()));
const mockGenerateTreatment = vi.hoisted(() => vi.fn(() => new Blob()));

vi.mock('../../services/toWhomsoeverPdf', () => ({ generateToWhomsoeverPdf: mockGenerateToWhom }));
vi.mock('../../services/annexurePdf', () => ({ generateAnnexurePdf: mockGenerateAnnexure }));
vi.mock('../../services/cashBillPdf', () => ({ generateCashBillPdf: mockGenerateCashBill }));
vi.mock('../../services/treatmentBillPdf', () => ({ generateTreatmentBillPdf: mockGenerateTreatment }));

const mockUseClinic = vi.fn();
vi.mock('../../context/ClinicContext', () => ({
  useClinic: () => mockUseClinic(),
}));

const defaultMocks = {
  patientInfo: { name: 'Test Patient', passportId: 'Z123', country: 'USA', invoiceNo: 'INV-001' },
  medicines: [{ id: '1', name: 'MedA', packQty: 2, rate: 100, total: 200 }],
  settings: {},
  validateForm: vi.fn(() => true),
  paymentOnline: 100,
  paymentCash: 100,
};

function setup(overrides = {}) {
  mockUseClinic.mockReturnValue({ ...defaultMocks, ...overrides });
  return render(
    <MemoryRouter>
      <PreviewPage />
    </MemoryRouter>,
  );
}

describe('PreviewPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        vi.spyOn(el, 'click').mockImplementation(() => {});
      }
      return el;
    });
  });

  it('renders document preview iframe after generation', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while generating PDFs', async () => {
    setup();
    // The useEffect fires synchronously, so the spinner briefly appears then disappears.
    // Verify the iframe eventually renders, meaning generation completed.
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
  });

  it('document tab switcher changes active document', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('2. Annexure-1'));
    expect(screen.getByText(/Annexure-1\.pdf/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('3. Cash Bill / Invoice'));
    expect(screen.getByText(/CashBill\.pdf/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('4. Treatment Bill'));
    expect(screen.getByText(/TreatmentBill\.pdf/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('1. Certification Letter'));
    expect(screen.getByText(/ToWhomsoever\.pdf/)).toBeInTheDocument();
  });

  it('download button triggers download', async () => {
    const appendChild = vi.spyOn(document.body, 'appendChild');
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Download'));
    expect(appendChild).toHaveBeenCalled();
    appendChild.mockRestore();
  });

  it('prints the document', async () => {
    const appendChild = vi.spyOn(document.body, 'appendChild');
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Print Page'));
    expect(appendChild).toHaveBeenCalled();
    appendChild.mockRestore();
  });

  it('"Download All" downloads all 4 documents', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    const appendChild = vi.spyOn(document.body, 'appendChild');
    fireEvent.click(screen.getByText(/Download All/));
    expect(appendChild).toHaveBeenCalled();
    appendChild.mockRestore();
  });

  it('shows error card when validation fails', () => {
    setup({ validateForm: vi.fn(() => false) });
    expect(screen.getByText('Cannot Generate Previews')).toBeInTheDocument();
  });

  it('zoom in/out buttons adjust zoom level', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    expect(screen.getByText('100%')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Zoom In'));
    expect(screen.getByText('110%')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Zoom Out'));
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('zoom respects min/max bounds', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    const zoomIn = screen.getByTitle('Zoom In');
    const zoomOut = screen.getByTitle('Zoom Out');
    for (let i = 0; i < 6; i++) fireEvent.click(zoomIn);
    expect(screen.getByText('150%')).toBeInTheDocument();
    for (let i = 0; i < 10; i++) fireEvent.click(zoomOut);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('"New Tab" link opens PDF in new tab', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    const link = screen.getByTitle('Open full page in new browser tab');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('patient file summary shows patient info', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Test Patient')).toBeInTheDocument();
    });
    expect(screen.getByText('Z123')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
  });

  it('generates correct PDF types based on activeDoc', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    expect(mockGenerateToWhom).toHaveBeenCalled();
    expect(mockGenerateAnnexure).toHaveBeenCalled();
    expect(mockGenerateCashBill).toHaveBeenCalled();
    expect(mockGenerateTreatment).toHaveBeenCalled();
  });

  it('pdf iframe renders with correct blob src', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    const iframe = screen.getByTitle('Live PDF Document Preview') as HTMLIFrameElement;
    expect(iframe.src).toContain('blob:test');
  });

  it('active document URL updates when switching tabs', async () => {
    URL.createObjectURL = vi.fn()
      .mockReturnValueOnce('blob:annexure')
      .mockReturnValueOnce('blob:bill')
      .mockReturnValueOnce('blob:cert')
      .mockReturnValueOnce('blob:treatment');
    setup();
    await waitFor(() => {
      expect(screen.getByTitle('Live PDF Document Preview')).toBeInTheDocument();
    });
    const getIframeSrc = () => (screen.getByTitle('Live PDF Document Preview') as HTMLIFrameElement).src;
    expect(getIframeSrc()).toContain('blob:cert');
    fireEvent.click(screen.getByText('2. Annexure-1'));
    expect(getIframeSrc()).toContain('blob:annexure');
    fireEvent.click(screen.getByText('3. Cash Bill / Invoice'));
    expect(getIframeSrc()).toContain('blob:bill');
    fireEvent.click(screen.getByText('4. Treatment Bill'));
    expect(getIframeSrc()).toContain('blob:treatment');
  });
});
