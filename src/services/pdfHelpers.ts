import { jsPDF } from 'jspdf';
import { ClinicSettings, PatientInfo } from '../types';
import logo from '../assets/logo.png';
import companyname from '../assets/companyname.png';
import footer from '../assets/footer.png';
import companyseel from '../assets/companyseel.png'

export function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
}

export function sealPage(doc: jsPDF, y: number): void {

  const imageProperties = doc.getImageProperties(companyseel);
  const logoBox = 40;
  const logoScale = Math.min(logoBox / imageProperties.width, logoBox / imageProperties.height);
  const logoWidth = imageProperties.width * logoScale;
  const logoHeight = imageProperties.height * logoScale;
  const logoFormat = logo.toLowerCase().includes('image/jpeg') ? 'JPEG' : 'PNG';

  doc.addImage(companyseel, logoFormat, 13, y, logoWidth, logoHeight);
}

export function drawTemplate(doc: jsPDF): void {

  doc.rect(10, 9, 190, 279);

  const imageProperties = doc.getImageProperties(logo);
  const logoBox = 40;
  const logoScale = Math.min(logoBox / imageProperties.width, logoBox / imageProperties.height);
  const logoWidth = imageProperties.width * logoScale;
  const logoHeight = imageProperties.height * logoScale;
  const logoFormat = logo.toLowerCase().includes('image/jpeg') ? 'JPEG' : 'PNG';



  doc.addImage(logo, logoFormat, 15, 11, logoWidth, logoHeight);
  doc.addImage(companyname, logoFormat, 45, 11, 151, 24);
  doc.addImage(footer, logoFormat, 11, 270, 188, 13);

  doc.setTextColor(25, 75, 150);
  doc.setFontSize(10);
  doc.text(' lukshmisidhaclinic@gmail.com', 80, 282, { align: 'left' });

  doc.setFontSize(12);
  doc.text('www.lakshmihealthcarecentrerockfort.com', 47, 45, { align: 'left' });
  doc.text('www.womenpilescare.com', 47, 50, { align: 'left' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(10, 56, 200, 56);
  doc.line(10, 269, 200, 269);
}

export function drawSignatureBlock(doc: jsPDF, settings: ClinicSettings, y: number): number {
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  if (y + 30 > pageHeight - 20) {
    doc.addPage();
    y = 25;
  }

  const signWidth = 65;
  const signHeight = 25;
  const signX = pageWidth - margin - signWidth;

  if (settings.signature) {
    try {
      doc.addImage(settings.signature, 'PNG', signX, y, signWidth, signHeight);
    } catch (error) {
      console.error('Error drawing signature in PDF:', error);
    }
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Authorized Signature', pageWidth - margin - 10, y + signHeight + 4, { align: 'right' });

  return y + signHeight + 10;
}

export function drawDocumentMetaAndToBlock(
  doc: jsPDF,
  patient: PatientInfo,
  isAnnexure: boolean,
  isBill: boolean,
  yStart: number
): number {
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.text(`Date: ${patient.date}`, pageWidth - margin, yStart, { align: 'right' });
  // if (isAnnexure) {
  //   doc.text(`Ref No: ${patient.refNo || 'N/A'}`, pageWidth - margin, yStart + 5, { align: 'right' });
  // } else if (isBill) {
  //   doc.text(`Invoice No: ${patient.invoiceNo}`, pageWidth - margin, yStart + 5, { align: 'right' });
  // } else {
  //   doc.text(`Ref No: ${patient.refNo || 'N/A'}`, pageWidth - margin, yStart + 5, { align: 'right' });
  // }

  const titleY = yStart + 15;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  let title = 'TO WHOMSOEVER IT MAY CONCERN';
  if (isAnnexure) {
    title = 'ANNEXURE-1';
  } else if (isBill) {
    title = 'CASH BILL / INVOICE';
  }
  doc.text(title, pageWidth / 2, titleY, { align: 'center' });

  let toY = titleY + 12;
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('To,', margin, toY);
  toY += 5;

  doc.setFont('times', 'normal');
  doc.text(patient.name, margin, toY);
  toY += 4.5;

  if (patient.companyName) {
    doc.text(patient.companyName, margin, toY);
    toY += 4.5;
  }

  if (patient.address) {
    const addressLines = doc.splitTextToSize(patient.address, 110);
    doc.text(addressLines, margin, toY);
    toY += addressLines.length * 4.5;
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

  return toY + 6;
}

export function addPageFooters(doc: jsPDF): void {
  const totalPages = doc.internal.pages.length - 1;
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    drawPageFooter(doc, pageNum, totalPages);
  }
}
