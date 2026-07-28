import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClinicSettings, PatientInfo, MedicineItem } from '../types';
import { numberToWords } from '../utils/numberToWords';
import { addPageFooters, drawSignatureBlock, drawTemplate, sealPage, getDoctorSeal, formatDateDisplay } from './pdfHelpers';

export function generateCashBillPdf(patient: PatientInfo, medicines: MedicineItem[], settings: ClinicSettings): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const BODY_FONT = 'times';

  drawTemplate(doc);

  const centerX = PAGE_WIDTH / 2;
  let y = 66;
  doc.setFont(BODY_FONT, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text('CASH BILL', centerX, y, { align: 'center' });

  doc.setFont(BODY_FONT, 'normal');
  doc.setFontSize(9.5);
  doc.text(`Date: ${formatDateDisplay(patient.date)}`, PAGE_WIDTH - 15, y - 5, { align: 'right' });
  doc.text(`Invoice No: ${patient.invoiceNo}`, PAGE_WIDTH - 15, y, { align: 'right' });


  y += 10;
  doc.setFontSize(9.5);
  doc.setFont(BODY_FONT, 'bold');
  doc.text('To,', 15, y);
  y += 5;
  doc.setFont(BODY_FONT, 'normal');
  doc.text(patient.name, 15, y);
  y += 4.5;
  if (patient.companyName) {
    doc.text(patient.companyName, 15, y);
    y += 4.5;
  }
  if (patient.address) {
    const addressLines = doc.splitTextToSize(patient.address, 105);
    doc.text(addressLines, 15, y);
    y += addressLines.length * 4.5;
  }
  doc.text(patient.country, 15, y);
  y += 4.5;
  if (patient.phone) {
    doc.text(`Phone: ${patient.phone}`, 15, y);
    y += 4.5;
  }
  if (patient.passportId) {
    doc.text(`Passport / ID: ${patient.passportId}`, 15, y);
    y += 4.5;
  }
  y += 5;

  const tableHeaders = [['S.No', 'Identification No', 'Dosage Unit', 'Qty', 'Rate per Unit (INR)', 'Total Value (INR)']];
  const tableData = medicines.map((med, index) => [
    (index + 1).toString(), med.name, med.unit, med.packQty.toString(), med.rate.toFixed(2), med.total.toFixed(2)
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: 'times', fontStyle: 'bold', fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.1, halign: 'center' },
    bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], font: 'times', fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.1 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 11 }, 1: { cellWidth: 53 }, 2: { halign: 'center', cellWidth: 17 },
      3: { halign: 'center', cellWidth: 13 }, 4: { halign: 'right', cellWidth: 31 }, 5: { halign: 'right', cellWidth: 35 }
    },
    styles: { overflow: 'linebreak', cellPadding: 2.2, lineColor: [0, 0, 0], lineWidth: 0.1, font: 'times' },
    margin: { left: 15, right: 15, top: 18, bottom: 20 }
  });

  const grandTotal = medicines.reduce((sum, item) => sum + item.total, 0);
  const doctorSeal = getDoctorSeal(settings.doctors, settings.selectedDoctorId);
  let tableEndY = (doc as any).lastAutoTable.finalY + 8;
  if (tableEndY + 38 > doc.internal.pageSize.height - 20) {
    doc.addPage();
    tableEndY = 25;
  }

  const formattedTotal = `INR ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', doc.internal.pageSize.width - 75, tableEndY, { align: 'right' });
  doc.text(formattedTotal, doc.internal.pageSize.width - 15, tableEndY, { align: 'right' });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  doc.line(doc.internal.pageSize.width - 75, tableEndY + 2, doc.internal.pageSize.width - 15, tableEndY + 2);

  const totalWords = numberToWords(grandTotal).replace(/^INR\s+/, '').replace(/\s+Only$/, '');
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(`Total worth of the product is INR ${formattedTotal.replace(/^INR\s+/, '')}`, 15, tableEndY + 12);
  doc.text(doc.splitTextToSize(`(Rupees ${totalWords} Only)`, doc.internal.pageSize.width - 30), 15, tableEndY + 17);

  let footerY = tableEndY + 30;
  if (footerY + 25 > doc.internal.pageSize.height - 20) {
    doc.addPage();
    footerY = 25;
  }
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Thanks & Regards', 15, footerY);
  sealPage(doc, footerY + 3, doctorSeal)
  drawSignatureBlock(doc, settings, footerY + 2);
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Page 3 of 3`, pageWidth - margin, pageHeight - 12, { align: 'right' });

  return doc.output('blob');
}
