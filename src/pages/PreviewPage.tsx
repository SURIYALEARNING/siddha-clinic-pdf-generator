import React, { useEffect, useState, useRef } from 'react';
import { useClinic } from '../context/ClinicContext';
import { 
  generateAnnexurePdf, 
  generateCashBillPdf, 
  generateToWhomsoeverPdf 
} from '../services/pdfService';
import { 
  FileText, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  AlertTriangle,
  FileCheck,
  Eye,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

type DocumentType = 'annexure' | 'bill' | 'certificate';

export const PreviewPage: React.FC = () => {
  const { patientInfo, medicines, settings, validateForm } = useClinic();
  
  const [activeDoc, setActiveDoc] = useState<DocumentType>('annexure');
  const [annexureUrl, setAnnexureUrl] = useState<string>('');
  const [billUrl, setBillUrl] = useState<string>('');
  const [certUrl, setCertUrl] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [isValid, setIsValid] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-generate PDFs on component mount or data changes
  useEffect(() => {
    const generateAllPdfs = () => {
      setIsGenerating(true);
      try {
        if (!validateForm()) {
          setIsValid(false);
          setIsGenerating(false);
          return;
        }
        setIsValid(true);

        // Clear previous URLs if any
        if (annexureUrl) URL.revokeObjectURL(annexureUrl);
        if (billUrl) URL.revokeObjectURL(billUrl);
        if (certUrl) URL.revokeObjectURL(certUrl);

        // Generate Blobs
        const annexureBlob = generateAnnexurePdf(patientInfo, medicines, settings);
        const billBlob = generateCashBillPdf(patientInfo, medicines, settings);
        const certBlob = generateToWhomsoeverPdf(patientInfo, settings);

        // Set URLs
        setAnnexureUrl(URL.createObjectURL(annexureBlob));
        setBillUrl(URL.createObjectURL(billBlob));
        setCertUrl(URL.createObjectURL(certBlob));
      } catch (err) {
        console.error("PDF generation failed:", err);
      } finally {
        setIsGenerating(false);
      }
    };

    generateAllPdfs();

    // Clean up URLs
    return () => {
      if (annexureUrl) URL.revokeObjectURL(annexureUrl);
      if (billUrl) URL.revokeObjectURL(billUrl);
      if (certUrl) URL.revokeObjectURL(certUrl);
    };
  }, [patientInfo, medicines, settings]);

  const getActiveUrl = () => {
    switch (activeDoc) {
      case 'annexure': return annexureUrl;
      case 'bill': return billUrl;
      case 'certificate': return certUrl;
    }
  };

  const getDocName = () => {
    const slug = (patientInfo.name || 'Patient').replace(/\s+/g, '_');
    switch (activeDoc) {
      case 'annexure': return `${slug}_Annexure-1.pdf`;
      case 'bill': return `${slug}_CashBill.pdf`;
      case 'certificate': return `${slug}_ToWhomsoever.pdf`;
    }
  };

  const handleDownload = () => {
    const url = getActiveUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = getDocName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const url = getActiveUrl();
    if (!url) return;
    
    // Create an iframe to print programmatically
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.src = url;
    document.body.appendChild(printFrame);

    printFrame.onload = () => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (e) {
        console.error("Print failed. Opening PDF in new tab instead.", e);
        window.open(url, '_blank');
      }
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    };
  };

  const handleDownloadAll = () => {
    const docs: { url: string; name: string }[] = [
      { url: annexureUrl, name: `${(patientInfo.name || 'Patient').replace(/\s+/g, '_')}_Annexure-1.pdf` },
      { url: billUrl, name: `${(patientInfo.name || 'Patient').replace(/\s+/g, '_')}_CashBill.pdf` },
      { url: certUrl, name: `${(patientInfo.name || 'Patient').replace(/\s+/g, '_')}_ToWhomsoever.pdf` }
    ];

    docs.forEach(doc => {
      if (doc.url) {
        const a = document.createElement('a');
        a.href = doc.url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 60));

  if (!isValid && !isGenerating) {
    return (
      <div id="preview-error-card" className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-full inline-block border border-rose-100">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Cannot Generate Previews</h3>
          <p className="text-xs text-slate-500 mt-2">
            The patient profile is currently incomplete or contains validation errors. Please return to previous steps and fill in the mandatory fields:
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 text-left border border-slate-100 space-y-2">
          <p className="font-bold text-slate-800">Required Items List:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Patient Name (Must be non-empty)</li>
            <li>Country (Destination country required for travel certificates)</li>
            <li>Medicines (Must possess at least 1 prescribed medicine in formula table)</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div id="document-preview-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-10rem)]">
      
      {/* LEFT COLUMN: Controls & Document Switcher (5/12 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
        
        {/* Document Switcher Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 shrink-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Document</h3>
          
          <div className="space-y-1.5">
            {/* Annexure Tab */}
            <button
              id="tab-btn-annexure"
              onClick={() => setActiveDoc('annexure')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left font-bold transition-all ${
                activeDoc === 'annexure'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <p>1. Annexure-1</p>
                  <p className="text-[10px] text-slate-400 font-medium">Customs & Medicine Manifest</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </button>

            {/* Cash Bill Tab */}
            <button
              id="tab-btn-bill"
              onClick={() => setActiveDoc('bill')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left font-bold transition-all ${
                activeDoc === 'bill'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <div>
                  <p>2. Cash Bill / Invoice</p>
                  <p className="text-[10px] text-slate-400 font-medium">Auto-Calculated Financials</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
            </button>

            {/* To Whomsoever Tab */}
            <button
              id="tab-btn-cert"
              onClick={() => setActiveDoc('certificate')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left font-bold transition-all ${
                activeDoc === 'certificate'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <div>
                  <p>3. Certification Letter</p>
                  <p className="text-[10px] text-slate-400 font-medium">To Whomsoever It May Concern</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            </button>
          </div>
        </div>

        {/* Global Hub Action Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5 shrink-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">File Commands</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              id="preview-btn-download"
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              id="preview-btn-print"
              onClick={handlePrint}
              disabled={isGenerating}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print Page</span>
            </button>
          </div>

          <button
            id="preview-btn-all"
            onClick={handleDownloadAll}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 border border-slate-900"
          >
            <FileCheck className="w-4 h-4" />
            <span>Download All 3 documents (ZIP/Batch)</span>
          </button>
        </div>

        {/* Info summary block */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex-1 min-h-[320px] overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <Eye className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Patient File Summary</h4>
          </div>
          
          <div className="space-y-2.5 text-xs text-slate-600">
            <p><strong className="text-slate-500">Name:</strong> <span className="text-slate-800 font-semibold">{patientInfo.name}</span></p>
            <p><strong className="text-slate-500">Passport / ID:</strong> <span className="text-slate-800 font-mono font-medium">{patientInfo.passportId || "N/A"}</span></p>
            <p><strong className="text-slate-500">Destination:</strong> <span className="text-slate-800 font-semibold">{patientInfo.country}</span></p>
            <p><strong className="text-slate-500">Total Bill Cost:</strong> <span className="text-slate-800 font-bold text-sm">INR {medicines.reduce((s, m) => s + m.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></p>
            <p><strong className="text-slate-500">Assigned Invoice:</strong> <span className="text-slate-800 font-mono">{patientInfo.invoiceNo}</span></p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-[10px] text-slate-500 space-y-1.5 mt-2">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Compliant Output Ready</span>
            </p>
            <p>PDF documents are generated strictly in standard A4 sizes, utilizing standard fonts, structured alignment tables, and programmatically injected vector logos for optimal print quality.</p>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Live PDF Preview Panel (8/12 cols) */}
      <div className="lg:col-span-8 flex flex-col border border-slate-200 bg-slate-100 rounded-2xl overflow-hidden shadow-xs relative">
        
        {/* Preview Control Bar */}
        <div className="bg-white border-b border-slate-200 h-12 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700">
              Live: {activeDoc === 'annexure' ? 'Annexure-1.pdf' : activeDoc === 'bill' ? 'CashBill.pdf' : 'ToWhomsoever.pdf'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-500 px-1 font-mono">{zoomLevel}%</span>
            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-all"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-slate-200 mx-2"></span>

            <a
              href={getActiveUrl()}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-slate-600 transition-all flex items-center gap-1 text-[10px] font-bold"
              title="Open full page in new browser tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">New Tab</span>
            </a>
          </div>
        </div>

        {/* PDF Frame Loader Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-bold">Compiling PDF documents...</p>
            </div>
          ) : getActiveUrl() ? (
            <div 
              className="w-full h-full bg-white shadow-xl border border-slate-300 rounded-lg transition-all overflow-hidden"
              style={{ width: `${zoomLevel}%`, maxWidth: '100%', height: '100%' }}
            >
              <iframe
                ref={iframeRef}
                src={`${getActiveUrl()}#toolbar=0&navpanes=0`}
                title="Live PDF Document Preview"
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="text-center text-slate-400 space-y-2">
              <AlertTriangle className="w-8 h-8 mx-auto" />
              <p className="text-xs font-semibold">Unable to load document preview</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
