import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClinicSettings, PatientInfo, MedicineItem } from '../types';
import { numberToWords } from '../utils/numberToWords';

// Helper to draw a minimal page footer on every page (pagination only, no branding)
function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Print plain page number at the bottom right
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
}

// Helper to draw signature block on the last page of documents
function drawSignatureBlock(doc: jsPDF, settings: ClinicSettings, y: number): number {
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Ensure we don't bleed off the page, if so, push to next page
  if (y + 30 > pageHeight - 20) {
    doc.addPage();
    y = 25; // reset y for new page
  }

  const signWidth = 45;
  const signHeight = 12;
  const signX = pageWidth - margin - signWidth;

  if (settings.signature) {
    try {
      doc.addImage(settings.signature, 'PNG', signX, y, signWidth, signHeight);
    } catch (e) {
      console.error("Error drawing signature in PDF:", e);
    }
  }

  // "Authorized Signature" label below
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0); // Black only
  doc.text("Authorized Signature", pageWidth - margin, y + signHeight + 4, { align: 'right' });

  return y + signHeight + 10;
}

// Helper to draw Document metadata (Date, ID) and the formal recipient "To," block
function drawDocumentMetaAndToBlock(doc: jsPDF, patient: PatientInfo, isAnnexure: boolean, isBill: boolean, yStart: number): number {
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;

  // 1. Date & Document ID (Invoice No or Reference No) at top-right
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  doc.text(`Date: ${patient.date}`, pageWidth - margin, yStart, { align: 'right' });
  if (isAnnexure) {
    doc.text(`Ref No: ${patient.refNo || "N/A"}`, pageWidth - margin, yStart + 5, { align: 'right' });
  } else if (isBill) {
    doc.text(`Invoice No: ${patient.invoiceNo}`, pageWidth - margin, yStart + 5, { align: 'right' });
  } else {
    doc.text(`Ref No: ${patient.refNo || "N/A"}`, pageWidth - margin, yStart + 5, { align: 'right' });
  }

  // 2. Document Title in Center
  const titleY = yStart + 15;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  let title = "TO WHOMSOEVER IT MAY CONCERN";
  if (isAnnexure) {
    title = "ANNEXURE-1";
  } else if (isBill) {
    title = "CASH BILL / INVOICE";
  }
  doc.text(title, pageWidth / 2, titleY, { align: 'center' });

  // 3. Recipient "To," Block on Left
  let toY = titleY + 12;
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text("To,", margin, toY);
  toY += 5;

  doc.setFont('times', 'normal');
  doc.text(patient.name, margin, toY);
  toY += 4.5;

  if (patient.companyName) {
    doc.text(patient.companyName, margin, toY);
    toY += 4.5;
  }

  if (patient.address) {
    // Wrap address nicely
    const addressLines = doc.splitTextToSize(patient.address, 110);
    doc.text(addressLines, margin, toY);
    toY += (addressLines.length * 4.5);
  }

  doc.text(patient.country, margin, toY);
  toY += 4.5;

  if (patient.phone) {
    doc.text(`Phone No: ${patient.phone}`, margin, toY);
    toY += 4.5;
  }

  if (patient.passportId) {
    doc.text(`Passport/ID: ${patient.passportId}`, margin, toY);
    toY += 4.5;
  }

  return toY + 6; // Return next Y coordinate for subsequent sections
}

/**
 * GENERATE ANNEXURE-1 PDF
 */
export function generateAnnexurePdf(patient: PatientInfo, medicines: MedicineItem[], settings: ClinicSettings): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Start directly below the pre-printed letterhead space (y=55)
  let y = 55;
  y = drawDocumentMetaAndToBlock(doc, patient, true, false, y);

  // Section header
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Prescribed Medicine Details & Dosage Schedule", 15, y);
  y += 5;

  // Medicine Table columns: S.No, Medicine, Qty, No of Pack, Morning, Noon, Night, Remarks
  const tableHeaders = [["S.No", "Medicine Name", "Dosage Qty", "No of Pack", "Morning", "Noon", "Night", "Food / Remarks"]];
  const tableData = medicines.map((med, index) => [
    (index + 1).toString(),
    med.name,
    med.unit,
    med.packQty.toString(),
    med.morning,
    med.noon,
    med.night,
    `${med.foodInstruction}${med.remarks ? ' - ' + med.remarks : ''}`
  ]);

  let tableEndY = y;
  
  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255], // White header
      textColor: [0, 0, 0], // Black text
      fontSize: 9,
      font: 'times',
      fontStyle: 'bold',
      lineColor: [0, 0, 0], // Black border
      lineWidth: 0.1
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 8.5,
      font: 'times',
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 48 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 14 },
      7: { cellWidth: 42 }
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      font: 'times'
    },
    margin: { left: 15, right: 15, top: 20, bottom: 20 }
  });

  tableEndY = (doc as any).lastAutoTable.finalY + 8;

  // Thanks and Signature block
  if (tableEndY + 30 > doc.internal.pageSize.height - 20) {
    doc.addPage();
    tableEndY = 25; // Reset y on new page
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Thanks & Regards,", 15, tableEndY);

  drawSignatureBlock(doc, settings, tableEndY + 2);

  // Draw footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages);
  }

  return doc.output('blob');
}

/**
 * GENERATE CASH BILL PDF
 */
export function generateCashBillPdf(patient: PatientInfo, medicines: MedicineItem[], settings: ClinicSettings): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Start directly below the pre-printed letterhead space (y=55)
  let y = 55;
  y = drawDocumentMetaAndToBlock(doc, patient, false, true, y);

  // Section Header
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Billing Particulars", 15, y);
  y += 5;

  // Medicine Table columns: S.No, Medicine, Pack, Quantity, Rate, Total
  const tableHeaders = [["S.No", "Particulars / Herbal Products", "Quantity (Pack)", "Dosage Size", "Unit Rate (INR)", "Total Amount (INR)"]];
  const tableData = medicines.map((med, index) => [
    (index + 1).toString(),
    med.name,
    med.packQty.toString(),
    med.unit,
    med.rate.toFixed(2),
    med.total.toFixed(2)
  ]);

  let tableEndY = y;

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 9,
      font: 'times',
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 8.5,
      font: 'times',
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 80 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 }
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      font: 'times'
    },
    margin: { left: 15, right: 15, top: 20, bottom: 20 }
  });

  tableEndY = (doc as any).lastAutoTable.finalY;

  // Calculate grand total
  const grandTotal = medicines.reduce((sum, item) => sum + item.total, 0);

  // Check page boundaries for totals block
  if (tableEndY + 30 > doc.internal.pageSize.height - 20) {
    doc.addPage();
    tableEndY = 25;
  }

  // Draw Grand Total Box (Simple rectangle outline with no colors/rounding)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(doc.internal.pageSize.width - 85, tableEndY + 4, 70, 8);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("GRAND TOTAL:", doc.internal.pageSize.width - 80, tableEndY + 9.5);
  doc.text(`INR ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, doc.internal.pageSize.width - 18, tableEndY + 9.5, { align: 'right' });

  // Total in Words
  const totalWords = numberToWords(grandTotal);
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text("Amount in Words:", 15, tableEndY + 18);
  
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  
  // Handle text wrapping for long total words
  const splitWords = doc.splitTextToSize(totalWords, doc.internal.pageSize.width - 15 - 45);
  doc.text(splitWords, 45, tableEndY + 18);

  // Footer: Thanks & Regards block
  let footerY = tableEndY + 28;
  if (footerY + 25 > doc.internal.pageSize.height - 20) {
    doc.addPage();
    footerY = 25;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Thanks & Regards,", 15, footerY);

  drawSignatureBlock(doc, settings, footerY + 2);

  // Draw footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages);
  }

  return doc.output('blob');
}

/**
 * GENERATE TO WHOMSOEVER IT MAY CONCERN PDF
 */
export function generateToWhomsoeverPdf(patient: PatientInfo, settings: ClinicSettings): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Start directly below the pre-printed letterhead space (y=55)
  let y = 55;
  y = drawDocumentMetaAndToBlock(doc, patient, false, false, y);

  y += 6;

  // Professional Certificate Body Text
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0); // Black only
  
  // Custom spacing / line height
  const p1 = `This is to certify that the traditional Indian herbal products and Siddha preparations listed in Annexure-1 (Reference ID: ${patient.refNo || 'N/A'}) have been customized, dispensed, and supplied to Mr./Ms. ${patient.name} for personal health support and wellness purposes.`;
  
  const p2 = `The patient resides at ${patient.address || '[Patient Address]'}, ${patient.country}, and is identified by Passport / ID Number: ${patient.passportId || '[N/A]'}. The herbal formulations were supplied on ${patient.date} under Cash Invoice Number ${patient.invoiceNo}.`;

  const p3 = `These formulations are purely traditional Indian herbal preparations (Siddha Medicine) meant for personal, non-commercial health support and dietary supplementation. They do not constitute restricted pharmaceutical drugs, narcotics, or scheduled substances under international drug regulations. These are entirely safe for travel, personal transit, and self-consumption.`;

  const p4 = `This certificate is issued at the request of the patient to facilitate custom clearance, travel documentation, or medical record verification. We wish them excellent health and a swift, complete recovery.`;

  const widthLimit = doc.internal.pageSize.width - 30; // margins 15 each

  // Paragraphs block with wrap
  const paras = [p1, p2, p3, p4];
  paras.forEach(paraText => {
    const splitPara = doc.splitTextToSize(paraText, widthLimit);
    doc.text(splitPara, 15, y);
    // Calculate space occupied
    const linesCount = splitPara.length;
    y += (linesCount * 5.8) + 6; // line spacing + paragraph gap
  });

  y += 5;

  // Thanks & Regards
  if (y + 25 > doc.internal.pageSize.height - 20) {
    doc.addPage();
    y = 25;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Thanks & Regards,", 15, y);

  // Signature Block
  drawSignatureBlock(doc, settings, y + 2);

  // Draw footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages);
  }

  return doc.output('blob');
}
