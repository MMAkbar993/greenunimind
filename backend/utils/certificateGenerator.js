import PDFDocument from 'pdfkit';

const GREEN_DARK = '#14532d';
const GREEN = '#16a34a';
const GREEN_SOFT = '#86efac';
const GOLD = '#c9a227';
const GOLD_DARK = '#a4791d';
const CREAM = '#fdfbf1';
const INK = '#111827';
const GRAY = '#6b7280';

// A simple pointed-leaf silhouette, used for corner sprigs and the sustainability line.
const drawLeaf = (doc, x, y, size, color) => {
  doc.save();
  doc.translate(x, y);
  doc.moveTo(0, size)
    .bezierCurveTo(size * 0.65, size * 0.55, size * 0.65, -size * 0.55, 0, -size)
    .bezierCurveTo(-size * 0.65, -size * 0.55, -size * 0.65, size * 0.55, 0, size)
    .fill(color);
  doc.moveTo(0, size * 0.75).lineTo(0, -size * 0.75)
    .lineWidth(0.5).strokeColor(CREAM).stroke();
  doc.restore();
};

// A small sprig of leaves along a stem, rotated to sit in a corner.
const drawCornerSprig = (doc, x, y, rotation) => {
  doc.save();
  doc.translate(x, y);
  doc.rotate(rotation);
  doc.moveTo(0, 0).lineTo(0, -56).lineWidth(1).strokeColor(GOLD).stroke();
  for (let i = 0; i < 5; i += 1) {
    const ly = -8 - i * 10;
    const side = i % 2 === 0 ? 1 : -1;
    doc.save();
    doc.translate(side * 5, ly);
    doc.rotate(side * -35);
    drawLeaf(doc, 0, 0, 6, i % 2 === 0 ? GREEN_SOFT : GOLD);
    doc.restore();
  }
  doc.restore();
};

// A tree growing out of a graduation cap — the GreenUniMind emblem, drawn as vector shapes
// (no external image asset, no emoji glyphs — those don't render with pdfkit's built-in fonts).
const drawTreeCapEmblem = (doc, cx, cy, scale, canopyColor, trunkColor, capColor) => {
  doc.save();
  doc.translate(cx, cy);
  doc.scale(scale);

  // trunk
  doc.rect(-3, 0, 6, 14).fill(trunkColor);

  // canopy
  const canopy = [
    [0, -20, 11], [-11, -11, 9], [11, -11, 9],
    [-7, -24, 8], [7, -24, 8], [0, -9, 10],
  ];
  canopy.forEach(([dx, dy, r]) => doc.circle(dx, dy, r).fill(canopyColor));

  // graduation cap
  doc.save();
  doc.translate(0, 16);
  doc.polygon([-15, 3], [0, -4], [15, 3], [0, 10]).fill(capColor);
  doc.rect(-7, 3, 14, 5).fill(capColor);
  doc.circle(0, -4, 1.6).fill(GOLD);
  doc.moveTo(11, 0).lineTo(13, 10).lineWidth(1).strokeColor(GOLD).stroke();
  doc.restore();

  doc.restore();
};

const drawSeal = (doc, cx, cy) => {
  doc.save();
  // ribbon tails
  doc.polygon([cx - 14, cy + 26], [cx - 2, cy + 20], [cx - 2, cy + 52]).fill(GREEN_DARK);
  doc.polygon([cx + 14, cy + 26], [cx + 2, cy + 20], [cx + 2, cy + 52]).fill(GREEN);

  // scalloped edge (small dots ring)
  const outerR = 32;
  for (let i = 0; i < 20; i += 1) {
    const angle = (i / 20) * Math.PI * 2;
    doc.circle(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR, 3.4).fill(GOLD);
  }

  doc.circle(cx, cy, 27).fill(GOLD_DARK);
  doc.circle(cx, cy, 24).fill(GOLD);
  doc.circle(cx, cy, 19).fill(CREAM);

  drawTreeCapEmblem(doc, cx, cy + 2, 0.55, GREEN_DARK, '#5b3a29', GREEN_DARK);
  doc.restore();
};

export const generateCertificatePDF = ({ studentName, courseName, completionDate, certificateId }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        // Every element below is placed with absolute coordinates, not flowed text —
        // keep margins minimal so nothing near the edges trips pdfkit's automatic
        // page-break-on-overflow and silently spills a blank second page.
        margins: { top: 10, bottom: 10, left: 10, right: 10 },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const width = doc.page.width;
      const height = doc.page.height;
      const centerX = width / 2;

      // Background
      doc.rect(0, 0, width, height).fill(CREAM);

      // Border
      const borderMargin = 20;
      doc.lineWidth(3)
        .strokeColor(GREEN_DARK)
        .rect(borderMargin, borderMargin, width - borderMargin * 2, height - borderMargin * 2)
        .stroke();

      doc.lineWidth(1)
        .strokeColor(GREEN_SOFT)
        .rect(borderMargin + 8, borderMargin + 8, width - (borderMargin + 8) * 2, height - (borderMargin + 8) * 2)
        .stroke();

      // Corner sprigs, one per corner, rotated to point inward
      drawCornerSprig(doc, borderMargin + 30, borderMargin + 30, 45);
      drawCornerSprig(doc, width - borderMargin - 30, borderMargin + 30, 135);
      drawCornerSprig(doc, borderMargin + 30, height - borderMargin - 30, -45);
      drawCornerSprig(doc, width - borderMargin - 30, height - borderMargin - 30, -135);

      // Emblem
      drawTreeCapEmblem(doc, centerX, 72, 1, GREEN, '#5b3a29', INK);
      doc.circle(centerX, 72, 34).lineWidth(1.5).strokeColor(GREEN).stroke();

      // Brand
      doc.fontSize(19).fillColor(GREEN_DARK).font('Times-Bold')
        .text('GreenUniMind AI', 0, 114, { align: 'center', width });

      doc.fontSize(8.5).fillColor(GRAY).font('Times-Roman')
        .text('SUSTAINABILITY EDUCATION FOR A BETTER FUTURE', 0, 136, {
          align: 'center', width, characterSpacing: 1.2,
        });

      // Divider with diamond ornament
      doc.moveTo(centerX - 150, 154).lineTo(centerX - 8, 154).lineWidth(1).strokeColor(GOLD).stroke();
      doc.moveTo(centerX + 8, 154).lineTo(centerX + 150, 154).lineWidth(1).strokeColor(GOLD).stroke();
      doc.save().translate(centerX, 154).rotate(45).rect(-4, -4, 8, 8).fill(GOLD).restore();

      // Title
      doc.fontSize(30).fillColor(GREEN).font('Times-Bold')
        .text('Certificate of Completion', 0, 166, { align: 'center', width });

      // "This certifies that"
      doc.fontSize(10.5).fillColor(GRAY).font('Times-Roman')
        .text('THIS IS TO CERTIFY THAT', 0, 208, { align: 'center', width, characterSpacing: 1.5 });

      // Student name
      doc.fontSize(30).fillColor(INK).font('Times-Bold')
        .text(studentName, 0, 226, { align: 'center', width });

      const nameWidth = doc.widthOfString(studentName);
      const nameX = centerX - nameWidth / 2;
      doc.moveTo(nameX - 20, 264).lineTo(nameX + nameWidth + 20, 264)
        .lineWidth(1).strokeColor('#d1d5db').stroke();

      // "has successfully completed"
      doc.fontSize(12).fillColor(GRAY).font('Times-Roman')
        .text('has successfully completed the course', 0, 276, { align: 'center', width });

      // Course name
      doc.fontSize(19).fillColor(GREEN).font('Times-Bold')
        .text(courseName, 60, 298, { align: 'center', width: width - 120 });

      // Platform line
      doc.fontSize(10.5).fillColor(GRAY).font('Times-Roman')
        .text('on the GreenUniMind AI sustainability education platform', 0, 328, { align: 'center', width });

      const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const footerY = 372;

      // Date block (left)
      doc.fontSize(13).fillColor(INK).font('Times-Bold')
        .text(formattedDate, 90, footerY, { width: 200, align: 'center' });
      doc.moveTo(90, footerY + 26).lineTo(290, footerY + 26)
        .lineWidth(1).strokeColor('#d1d5db').stroke();
      doc.fontSize(9.5).fillColor(GRAY).font('Times-Roman')
        .text('DATE OF COMPLETION', 90, footerY + 32, { width: 200, align: 'center', characterSpacing: 1 });

      // Seal (center)
      drawSeal(doc, centerX, footerY + 18);

      // Signature block (right)
      doc.fontSize(15).fillColor(GREEN_DARK).font('Times-Italic')
        .text('GreenUniMind AI', width - 290, footerY, { width: 200, align: 'center' });
      doc.moveTo(width - 290, footerY + 26).lineTo(width - 90, footerY + 26)
        .lineWidth(1).strokeColor('#d1d5db').stroke();
      doc.fontSize(9.5).fillColor(GRAY).font('Times-Roman')
        .text('GREENUNIMIND AI', width - 290, footerY + 32, { width: 200, align: 'center', characterSpacing: 1 });

      // Certificate ID
      doc.fontSize(8).fillColor('#9ca3af').font('Helvetica')
        .text(`Certificate ID: ${certificateId}`, 0, height - 52, { align: 'center', width });

      // Sustainability tagline with a small leaf mark instead of an emoji
      const tagline = 'Contributing to a sustainable future through education';
      doc.fontSize(9).fillColor(GREEN).font('Times-Italic');
      const tagWidth = doc.widthOfString(tagline);
      const tagY = height - 36;
      drawLeaf(doc, centerX - tagWidth / 2 - 12, tagY + 5, 5, GREEN);
      doc.text(tagline, 0, tagY, { align: 'center', width });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
