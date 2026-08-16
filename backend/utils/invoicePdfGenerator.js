import PDFDocument from 'pdfkit';

export const generateInvoicePDF = ({
  invoiceNumber,
  issuedDate,
  studentName,
  studentEmail,
  teacherName,
  courseTitle,
  amount,
  currency,
  status,
  businessName,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const width = doc.page.width;

      doc.fontSize(22).fillColor('#16a34a').font('Helvetica-Bold').text(businessName || 'GreenUniMind AI', 50, 50);
      doc.fontSize(10).fillColor('#6b7280').font('Helvetica').text('Sustainability Education Platform', 50, 78);

      doc.fontSize(20).fillColor('#111827').font('Helvetica-Bold').text('INVOICE', 0, 50, { align: 'right', width: width - 50 });
      doc.fontSize(10).fillColor('#6b7280').font('Helvetica').text(`Invoice #: ${invoiceNumber}`, 0, 78, { align: 'right', width: width - 50 });
      doc.text(`Date: ${new Date(issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 0, 92, { align: 'right', width: width - 50 });

      doc.moveTo(50, 120).lineTo(width - 50, 120).lineWidth(1).strokeColor('#e5e7eb').stroke();

      doc.fontSize(11).fillColor('#6b7280').font('Helvetica-Bold').text('Billed To', 50, 140);
      doc.fontSize(12).fillColor('#111827').font('Helvetica').text(studentName, 50, 158);
      doc.fontSize(10).fillColor('#6b7280').text(studentEmail, 50, 176);

      doc.fontSize(11).fillColor('#6b7280').font('Helvetica-Bold').text('Instructor', 0, 140, { align: 'right', width: width - 50 });
      doc.fontSize(12).fillColor('#111827').font('Helvetica').text(teacherName, 0, 158, { align: 'right', width: width - 50 });

      const tableTop = 230;
      doc.rect(50, tableTop, width - 100, 30).fill('#f0fdf4');
      doc.fontSize(10).fillColor('#16a34a').font('Helvetica-Bold');
      doc.text('Description', 60, tableTop + 10);
      doc.text('Status', width - 220, tableTop + 10, { width: 80, align: 'right' });
      doc.text('Amount', width - 130, tableTop + 10, { width: 70, align: 'right' });

      const rowTop = tableTop + 40;
      doc.fontSize(11).fillColor('#111827').font('Helvetica');
      doc.text(courseTitle, 60, rowTop, { width: width - 260 });
      doc.fontSize(10).fillColor('#6b7280').text(status.charAt(0).toUpperCase() + status.slice(1), width - 220, rowTop, { width: 80, align: 'right' });
      doc.fontSize(11).fillColor('#111827').font('Helvetica-Bold').text(
        new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount),
        width - 130,
        rowTop,
        { width: 70, align: 'right' }
      );

      doc.moveTo(50, rowTop + 40).lineTo(width - 50, rowTop + 40).lineWidth(1).strokeColor('#e5e7eb').stroke();

      doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold').text('Total', width - 220, rowTop + 55, { width: 80, align: 'right' });
      doc.fontSize(14).fillColor('#16a34a').font('Helvetica-Bold').text(
        new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount),
        width - 130,
        rowTop + 53,
        { width: 70, align: 'right' }
      );

      doc.fontSize(9).fillColor('#9ca3af').font('Helvetica').text(
        'Thank you for learning with GreenUniMind AI.',
        50,
        doc.page.height - 80,
        { align: 'center', width: width - 100 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
