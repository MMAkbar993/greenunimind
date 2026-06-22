import PDFDocument from 'pdfkit';

export const generateCertificatePDF = ({ studentName, courseName, completionDate, certificateId }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const width = doc.page.width;
      const height = doc.page.height;

      // Background
      doc.rect(0, 0, width, height).fill('#f0fdf4');

      // Border
      const borderMargin = 20;
      doc.lineWidth(3)
        .strokeColor('#16a34a')
        .rect(borderMargin, borderMargin, width - borderMargin * 2, height - borderMargin * 2)
        .stroke();

      doc.lineWidth(1)
        .strokeColor('#86efac')
        .rect(borderMargin + 8, borderMargin + 8, width - (borderMargin + 8) * 2, height - (borderMargin + 8) * 2)
        .stroke();

      // Corner decorations
      const cornerSize = 40;
      const corners = [
        [borderMargin + 15, borderMargin + 15],
        [width - borderMargin - 15 - cornerSize, borderMargin + 15],
        [borderMargin + 15, height - borderMargin - 15 - cornerSize],
        [width - borderMargin - 15 - cornerSize, height - borderMargin - 15 - cornerSize],
      ];
      for (const [x, y] of corners) {
        doc.rect(x, y, cornerSize, cornerSize).lineWidth(1.5).strokeColor('#16a34a').stroke();
      }

      // Header - leaf icon placeholder
      const centerX = width / 2;
      doc.fontSize(28).fillColor('#16a34a').font('Helvetica-Bold')
        .text('🌿', 0, 55, { align: 'center', width });

      // Title
      doc.fontSize(14).fillColor('#6b7280').font('Helvetica')
        .text('GREENUNIMIND AI', 0, 90, { align: 'center', width });

      doc.fontSize(36).fillColor('#16a34a').font('Helvetica-Bold')
        .text('Certificate of Completion', 0, 115, { align: 'center', width });

      // Decorative line
      doc.moveTo(centerX - 150, 165).lineTo(centerX + 150, 165)
        .lineWidth(2).strokeColor('#86efac').stroke();

      // "This certifies that"
      doc.fontSize(13).fillColor('#6b7280').font('Helvetica')
        .text('This is to certify that', 0, 185, { align: 'center', width });

      // Student name
      doc.fontSize(30).fillColor('#111827').font('Helvetica-Bold')
        .text(studentName, 0, 210, { align: 'center', width });

      // Underline for student name
      const nameWidth = doc.widthOfString(studentName);
      const nameX = centerX - nameWidth / 2;
      doc.moveTo(nameX, 248).lineTo(nameX + nameWidth, 248)
        .lineWidth(1).strokeColor('#d1d5db').stroke();

      // "has successfully completed"
      doc.fontSize(13).fillColor('#6b7280').font('Helvetica')
        .text('has successfully completed the course', 0, 262, { align: 'center', width });

      // Course name
      doc.fontSize(22).fillColor('#16a34a').font('Helvetica-Bold')
        .text(courseName, 60, 290, { align: 'center', width: width - 120 });

      // "on GreenUniMind AI platform"
      doc.fontSize(12).fillColor('#6b7280').font('Helvetica')
        .text('on the GreenUniMind AI sustainability education platform', 0, 340, { align: 'center', width });

      // Date
      const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Signature lines
      const sigY = 390;

      doc.moveTo(100, sigY + 30).lineTo(300, sigY + 30)
        .lineWidth(1).strokeColor('#d1d5db').stroke();
      doc.fontSize(10).fillColor('#6b7280').font('Helvetica')
        .text('Date of Completion', 100, sigY + 35, { width: 200, align: 'center' });
      doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold')
        .text(formattedDate, 100, sigY + 12, { width: 200, align: 'center' });

      doc.moveTo(width - 300, sigY + 30).lineTo(width - 100, sigY + 30)
        .lineWidth(1).strokeColor('#d1d5db').stroke();
      doc.fontSize(10).fillColor('#6b7280').font('Helvetica')
        .text('GreenUniMind AI', width - 300, sigY + 35, { width: 200, align: 'center' });
      doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold')
        .text('Sustainability Education', width - 300, sigY + 12, { width: 200, align: 'center' });

      // Certificate ID
      doc.fontSize(8).fillColor('#9ca3af').font('Helvetica')
        .text(`Certificate ID: ${certificateId}`, 0, height - 55, { align: 'center', width });

      // Sustainability message
      doc.fontSize(9).fillColor('#16a34a').font('Helvetica')
        .text('🌍 Contributing to a sustainable future through education', 0, height - 42, { align: 'center', width });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
