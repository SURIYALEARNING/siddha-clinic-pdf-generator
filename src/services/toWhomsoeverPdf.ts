import { jsPDF } from 'jspdf';
import { ClinicSettings, PatientInfo } from '../types';
import { addPageFooters, drawSignatureBlock, drawTemplate, sealPage } from './pdfHelpers';

export function generateToWhomsoeverPdf(patient: PatientInfo, settings: ClinicSettings): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  drawTemplate(doc);

  const LEFT = 15;
  const RIGHT = 15;
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT;
  let y = 65;


  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(`Date : ${patient.date}`, PAGE_WIDTH - 50, y);
  y += 12;

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('TO WHOM SO EVER IT MAY CONCERN', PAGE_WIDTH / 2, y, { align: 'center' });

  y += 12;
  doc.setFont('times', 'normal');
  doc.setFontSize(15);
  const body = `I am writing this letter to inform you that the Indian Traditional Herbal products as given in Annexure-1 are given ${patient.name.toUpperCase()}, ${patient.address}, ${patient.country}, PH NO: ${patient.phone || '-'}, ID NO: ${patient.passportId || '-'} for his/her general health purpose. These products are not a drug. So, no need of declaration from Indian Narcotics Departments.`;
  const lines = doc.splitTextToSize(body, doc.internal.pageSize.width - 30);
  doc.text(lines, 15, y);

  y += lines.length * 6 + 15;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text('Thanks & Regards,', 15, y);
  sealPage(doc, y + 3)
  drawSignatureBlock(doc, settings, y + 5);
  addPageFooters(doc);

  return doc.output('blob');
}
