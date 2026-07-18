import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClinicSettings, PatientInfo, MedicineItem } from '../types';
import { addPageFooters, drawDocumentMetaAndToBlock, drawSignatureBlock, drawTemplate } from './pdfHelpers';

export function generateAnnexurePdf(patient: PatientInfo, medicines: MedicineItem[], settings: ClinicSettings): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  drawTemplate(doc);
  let y = 65;
  y = drawDocumentMetaAndToBlock(doc, patient, true, false, y);

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Prescribed Medicine Details & Dosage Schedule', 15, y);
  y += 5;

  const tableHeaders = [['S.No', 'Medicine Name', 'Dosage Qty', 'No of Pack', 'Morning', 'Noon', 'Night', 'Food / Remarks']];
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

  autoTable(doc, {
    startY: y,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 9, font: 'times', fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.1 },
    bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 8.5, font: 'times', lineColor: [0, 0, 0], lineWidth: 0.1 },
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
    styles: { overflow: 'linebreak', cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.1, font: 'times' },
    margin: { left: 15, right: 15, top: 20, bottom: 20 }
  });

  let tableEndY = (doc as any).lastAutoTable.finalY + 8;
  if (tableEndY + 30 > doc.internal.pageSize.height - 20) {
    doc.addPage();
    tableEndY = 25;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Thanks & Regards,', 15, tableEndY);
  drawSignatureBlock(doc, settings, tableEndY + 2);
  addPageFooters(doc);

  return doc.output('blob');
}
