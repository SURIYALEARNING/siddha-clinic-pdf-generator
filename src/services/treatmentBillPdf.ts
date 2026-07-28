import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClinicSettings, PatientInfo, MedicineItem } from '../types';
import { numberToWords } from '../utils/numberToWords';
import { addPageFooters, sealPage, drawSignatureBlock, drawTemplate, treatmentBillHeadterFooter, getDoctorSeal, formatDateDisplay } from './pdfHelpers';

const MARGIN = 15;
const BODY_FONT = 'times';
const GRAY = 0;
const BLACK: [number, number, number] = [0, 0, 0];

function drawLabelValue(doc: jsPDF, label: string, value: string | undefined, x: number, y: number, availableWidth?: number): number {
  const display = value || 'N/A';
  doc.setFont(BODY_FONT, 'bold');
  doc.setFontSize(9);
  doc.text(label, x, y);
  const labelWidth = doc.getTextWidth(label);
  doc.setFont(BODY_FONT, 'normal');
  if (availableWidth) {
    const text = doc.splitTextToSize(display, availableWidth - labelWidth);
    doc.text(text, x + labelWidth, y);
  } else {
    doc.text(display, x + labelWidth, y);
  }
  return y + 5;
}

export function generateTreatmentBillPdf(patient: PatientInfo, medicines: MedicineItem[], settings: ClinicSettings, paymentOnline: number = 0, paymentCash: number = 0): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const centerX = PAGE_WIDTH / 2;



  let y = 66;

  doc.setFont(BODY_FONT, 'bold');
  doc.setFontSize(16);
  doc.text('TREATMENT BILL', centerX, y, { align: 'center' });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(centerX - 28, y + 1.5, centerX + 28, y + 1.5);

  y += 10;

  doc.setFont(BODY_FONT, 'normal');
  doc.setFontSize(9.5);
  doc.text(`OP No: ${patient.opNo || ''}`, MARGIN, y);
  doc.text(`Date: ${formatDateDisplay(patient.date)}`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
  doc.text(`Invoice No: ${patient.invoiceNo}`, PAGE_WIDTH - MARGIN, y + 5, { align: 'right' });

  y += 8;

  doc.setFont(BODY_FONT, 'bold');
  doc.setFontSize(10);
  doc.text('Patient Details:', MARGIN, y);
  y += 6;

  y = drawLabelValue(doc, 'Patient Name: ', patient.name, MARGIN, y);
  y = drawLabelValue(doc, 'Age: ', patient.age, MARGIN, y, 140);
  doc.setFont(BODY_FONT, 'bold');
  doc.setFontSize(9);
  doc.text('Sex: ', MARGIN, y);
  doc.setFont(BODY_FONT, 'normal');
  doc.text(patient.sex || 'N/A', MARGIN + doc.getTextWidth('Sex: '), y);

  y += 5;
  y = drawLabelValue(doc, 'Mobile Number: ', patient.phone, MARGIN, y);
  y = drawLabelValue(doc, 'Address: ', patient.address, MARGIN, y, 160);
  y += 4
  y = drawLabelValue(doc, 'Diagnosis: ', patient.diagnosis, MARGIN, y, 160);

  y += 3;

  const tableHeaders = [['S No', 'Description', 'Dosage Unit', 'Qty']];
  const tableData = medicines.map((med, index) => [
    (index + 1).toString(),
    med.name,
    med.unit,
    med.quantityLabel || med.packQty.toString()
  ]);

  const colWidths = [12, 88, 44, 36];

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: BLACK,
      font: BODY_FONT,
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: BLACK,
      lineWidth: 0.1,
      halign: 'center'
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: BLACK,
      font: BODY_FONT,
      fontSize: 8,
      lineColor: BLACK,
      lineWidth: 0.1
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: colWidths[0] },
      1: { cellWidth: colWidths[1] },
      2: { halign: 'center', cellWidth: colWidths[2] },
      3: { halign: 'center', cellWidth: colWidths[3] }
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2.2,
      lineColor: BLACK,
      lineWidth: 0.1,
      font: BODY_FONT
    },
    margin: { left: MARGIN, right: MARGIN, top: 60, bottom: 30 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawTemplate(doc);
      }
    }
  });

  const grandTotal = medicines.reduce((sum, item) => sum + item.total, 0);
  const doctorSeal = getDoctorSeal(settings.doctors, settings.selectedDoctorId);
  const tableLeft = MARGIN;
  const tableRight = PAGE_WIDTH - MARGIN;
  let finalY = (doc as any).lastAutoTable.finalY;

  if (finalY + 70 > PAGE_HEIGHT - 20) {
    doc.addPage();
    drawTemplate(doc);
    finalY = 60;
  }

  const rowHeight = 7;
  const totalCol1X = tableLeft + colWidths[0];
  const totalCol2X = totalCol1X + colWidths[1];
  const totalCol3X = totalCol2X + colWidths[2];

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.1);
  doc.rect(tableLeft, finalY, colWidths[0], rowHeight);
  doc.rect(totalCol1X, finalY, colWidths[1] + colWidths[2], rowHeight);
  doc.rect(totalCol3X, finalY, colWidths[3], rowHeight);

  doc.setFont(BODY_FONT, 'bold');
  doc.setFontSize(8);
  doc.text(
    'Total Treatment Charges',
    totalCol1X + (colWidths[1] + colWidths[2]) / 2,
    finalY + rowHeight - 2,
    { align: 'center' }
  );
  doc.text(
    grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    totalCol3X + colWidths[3] - 2,
    finalY + rowHeight - 2,
    { align: 'right' }
  );

  let contentY = finalY + rowHeight + 6;

  doc.setFont(BODY_FONT, 'normal');
  doc.setFontSize(9);
  const totalText = grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const words = numberToWords(grandTotal);
  doc.text(`Total: Rs.${totalText}`, MARGIN, contentY);
  contentY += 5;
  doc.text(`In Words: ${words}`, MARGIN, contentY);
  contentY += 7;

  doc.setFont(BODY_FONT, 'bold');
  doc.setFontSize(9);
  doc.text('Mode of Payment:', MARGIN, contentY);
  contentY += 5;
  doc.setFont(BODY_FONT, 'normal');
  doc.text(`Payment Mode Online: ${paymentOnline.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, MARGIN, contentY);
  contentY += 5;
  doc.text(`Payment Mode Cash: ${paymentCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, MARGIN, contentY);
  contentY += 8;
  sealPage(doc, contentY - 2, doctorSeal)
  drawSignatureBlock(doc, settings, contentY);

  const lastPageNum = doc.internal.pages.length - 1;
  doc.setPage(lastPageNum);
  const sigEndY = (doc as any).lastSignatureEndY || (contentY + 35);
  let discY = Math.max(sigEndY, doc.internal.pageSize.height - 55);

  if (discY > PAGE_HEIGHT - 30) {
    doc.addPage();
    drawTemplate(doc);
    discY = 60;
  }


  discY += 5;
  treatmentBillHeadterFooter(doc, discY, tableRight)




  return doc.output('blob');
}
