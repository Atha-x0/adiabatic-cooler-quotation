const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Helper to draw SVG paths for icons
 */
function drawIcon(doc, pathStr, x, y, size = 12, fillColor = '#000000') {
  doc.save();
  doc.translate(x, y);
  const scale = size / 16; // Icons designed on a 16x16 grid
  doc.scale(scale);
  doc.path(pathStr).fillColor(fillColor).fill();
  doc.restore();
}

// Icon path constants
const ICONS = {
  phone: 'M3 0 C1.5 0 0 1.5 0 3 C0 8.5 4.5 13 10 13 C11.5 13 13 11.5 13 10 L11 8 C10.5 7.5 9.5 7.5 9 8 L8 9 C6 8 5 7 4 5 L5 4 C5.5 3.5 5.5 2.5 5 2 L3 0 Z',
  envelope: 'M0 2 L0 12 L16 12 L16 2 Z M2 4 L8 8 L14 4 Z M2 5.5 L5.5 8 L2 10.5 Z M14 5.5 L14 10.5 L10.5 8 Z M6.5 8.7 L8 9.7 L9.5 8.7 L13 11.5 L3 11.5 Z',
  user: 'M8 0 C10.2 0 12 1.8 12 4 C12 6.2 10.2 8 8 8 C5.8 8 4 6.2 4 4 C4 1.8 5.8 0 8 0 Z M2 14 C2 10.5 5 10 8 10 C11 10 14 10.5 14 14 Z',
  cog: 'M8 6 C6.9 6 6 6.9 6 8 C6 9.1 6.9 10 8 10 C9.1 10 10 9.1 10 8 C10 6.9 9.1 6 8 6 Z M8 1 C7.5 1 7.1 1.3 7 1.8 L6.7 3 C6.1 3.2 5.6 3.5 5.1 3.9 L4 3.1 C3.6 2.8 3.1 2.9 2.8 3.3 L1.3 5.9 C1.1 6.3 1.2 6.8 1.6 7.1 L2.6 7.9 C2.5 8.2 2.5 8.5 2.6 8.8 L1.6 9.6 C1.2 9.9 1.1 10.4 1.3 10.8 L2.8 13.4 C3.1 13.8 3.6 13.9 4.0 13.6 L5.1 12.8 C5.6 13.2 6.1 13.5 6.7 13.7 L7.0 14.9 C7.1 15.4 7.5 15.7 8.0 15.7 C8.5 15.7 8.9 15.4 9.0 14.9 L9.3 13.7 C9.9 13.5 10.4 13.2 10.9 12.8 L12.0 13.6 C12.4 13.9 12.9 13.8 13.2 13.4 L14.7 10.8 C14.9 10.4 14.8 9.9 14.4 9.6 L13.4 8.8 C13.5 8.5 13.5 8.2 13.4 7.9 L14.4 7.1 C14.8 6.8 14.9 6.3 14.7 5.9 L13.2 3.3 C12.9 2.9 12.4 2.8 12.0 3.1 L10.9 3.9 C10.4 3.5 9.9 3.2 9.3 3.0 L9.0 1.8 C8.9 1.3 8.5 1 8.0 1 Z',
  droplet: 'M8 0 C8 0 2 6 2 10.5 C2 13.5 4.7 16 8 16 C11.3 16 14 13.5 14 10.5 C14 6 8 0 8 0 Z',
  document: 'M2 0 L10 0 L14 4 L14 16 L2 16 Z M3 2 L9 2 L9 5 L12 5 L12 15 L3 15 Z M5 7 L11 7 M5 10 L11 10 M5 13 L9 13',
  grid: 'M1 1 H3 V3 H1 Z M6 1 H8 V3 H6 Z M11 1 H13 V3 H11 Z M1 6 H3 V8 H1 Z M6 6 H8 V8 H6 Z M11 6 H13 V8 H11 Z M1 11 H3 V13 H1 Z M6 11 H8 V13 H6 Z M11 11 H13 V13 H11 Z',
  box: 'M1 4 L8 1 L15 4 L15 12 L8 15 L1 12 Z M8 1.5 L14 3.8 L8 6.1 L2 3.8 Z M8 6.8 L14 4.5 L14 11.2 L8 13.9 Z M2 4.5 L8 6.8 L8 13.9 L2 11.2 Z'
};

/**
 * Generate a PDF quotation and write it to the response stream or file system.
 * @param {object} quote - The quotation record from the database
 * @param {object} res - Express response stream (optional)
 * @param {string} filePath - Local file path to save to (optional)
 */
function generateQuotePdf(quote, res = null, filePath = null) {
  return new Promise((resolve, reject) => {
    // Standard A4: 595.28 x 841.89
    const doc = new PDFDocument({ size: 'A4', margin: 0 });

    let writeStream;
    if (filePath) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
    }
    
    if (res) {
      doc.pipe(res);
    }

    // Register Google Fonts (Roboto) - look in local and backend folders
    const resolveFont = (basename, ext = '.ttf') => {
      const filenames = [`${basename}-v2${ext}`, `${basename}${ext}`];
      for (const filename of filenames) {
        const paths = [
          path.join(__dirname, 'fonts', filename),
          path.join(__dirname, 'backend', 'fonts', filename),
          path.join(__dirname, '..', 'fonts', filename)
        ];
        for (const p of paths) {
          if (fs.existsSync(p)) return p;
        }
      }
      return null;
    };

    const resolveLogo = () => {
      const paths = [
        path.join(__dirname, 'seetech-logo.png'),
        path.join(__dirname, 'backend', 'seetech-logo.png'),
        path.join(__dirname, '..', 'seetech-logo.png')
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return null;
    };


    const fontPathSpaced = resolveFont('Spaced-Regular', '.otf');
    const fontPathRegular = resolveFont('ProductSans-Regular');
    const fontPathBold = resolveFont('ProductSans-Bold');
    const fontPathItalic = resolveFont('ProductSans-Italic');
    const fontPathBoldItalic = resolveFont('ProductSans-BoldItalic');

    if (fontPathSpaced) doc.registerFont('Spaced', fontPathSpaced);
    else doc.registerFont('Spaced', 'Helvetica');

    if (fontPathRegular) doc.registerFont('ProductSans', fontPathRegular);
    else doc.registerFont('ProductSans', 'Helvetica');

    if (fontPathBold) doc.registerFont('ProductSans-Bold', fontPathBold);
    else doc.registerFont('ProductSans-Bold', 'Helvetica-Bold');

    if (fontPathItalic) doc.registerFont('ProductSans-Italic', fontPathItalic);
    else doc.registerFont('ProductSans-Italic', 'Helvetica-Oblique');

    if (fontPathBoldItalic) doc.registerFont('ProductSans-BoldItalic', fontPathBoldItalic);
    else doc.registerFont('ProductSans-BoldItalic', 'Helvetica-BoldOblique');

    // Colors
    const brandBlue = '#0f4c81';      // Primary template blue
    const brandLightBlue = '#f0f7ff'; // Light card blue
    const brandGreen = '#009639';     // Logo green
    const brandLightGreen = '#f0fdf4';// Light card green
    const brandDarkGreen = '#10b981'; // Grand Total background green
    
    const primaryColor = '#1e293b';  // Text dark Slate 800
    const textColor = '#334155';     // Slate 700
    const lightBg = '#f8fafc';       // Zebra rows / background
    const borderColor = '#cbd5e1';   // Slate 300
    const borderLight = '#e2e8f0';   // Table inner borders

    // Formatting date & numbers
    const dateStr = new Date(quote.created_at || Date.now()).toLocaleDateString('en-IN');
    const quoteNum = quote.quote_number || `Q-${new Date(quote.created_at || Date.now()).toISOString().slice(0, 10).replace(/-/g, '')}-${String(quote.id).padStart(4, '0')}`;

    const formatCurrency = (val) => {
      return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 1. TOP HEADER BANNER
    doc.rect(0, 0, 595, 30).fill(brandBlue);
    
    // Top Bar text and icons
    drawIcon(doc, ICONS.phone, 50, 9, 12, '#ffffff');
    doc.fillColor('#ffffff').font('ProductSans-Bold').fontSize(10).text('+91 94226 95021', 68, 10);
    
    doc.moveTo(175, 8).lineTo(175, 22).strokeColor('#88aacc').lineWidth(1).stroke();

    drawIcon(doc, ICONS.envelope, 190, 9, 12, '#ffffff');
    doc.fillColor('#ffffff').font('ProductSans').fontSize(10).text('info@seetechsolutions.in', 210, 10);

    // 2. BRANDING / LOGO SECTION
    const logoPath = resolveLogo();
    if (logoPath) {
      doc.image(logoPath, 50, 42, { width: 220 });
    } else {
      // Seetech Solutions Logo (vector reproduction fallback)
      const logoX = 50;
      const logoY = 50;
      doc.save();
      doc.translate(logoX + 20, logoY + 25);
      doc.path('M -18 -8 C -15 -18, -3 -22, 8 -18 C 15 -14, 18 -5, 15 4 C 13 10, 7 14, 0 15')
         .lineWidth(3).strokeColor(brandGreen).stroke();
      doc.path('M -8 12 C -15 8, -17 -2, -12 -10 C -8 -15, 0 -17, 7 -12 C 12 -8, 11 0, 7 4')
         .lineWidth(3).strokeColor(brandBlue).stroke();
      doc.path('M -4 -8 C -2 -11, 2 -11, 4 -8 C 5 -5, 1 -3, -1 0 C -4 3, -4 7, -1 10 C 2 12, 6 11, 7 8')
         .lineWidth(2.5).strokeColor(primaryColor).stroke();
      doc.restore();

      doc.fillColor(brandGreen).font('Spaced').fontSize(26).text('SEETECH', 95, 52);
      doc.fillColor('#475569').font('Spaced').fontSize(15).text('S O L U T I O N', 95, 77);
      doc.moveTo(95, 96).lineTo(250, 96).strokeColor(brandGreen).lineWidth(1.5).stroke();
      doc.fillColor('#64748b').font('ProductSans-Italic').fontSize(9.5).text('energy savings delivered...', 108, 101);
    }

    // Right Quotation Headers
    doc.fillColor(brandBlue).font('Spaced').fontSize(22).text('QUOTATION', 400, 52, { align: 'right' });
    
    doc.fillColor(primaryColor).font('ProductSans-Bold').fontSize(10.5).text('Quote #:', 310, 85, { width: 130, align: 'right' });
    doc.fillColor(brandBlue).font('ProductSans-Bold').fontSize(10.5).text(quoteNum, 450, 85, { width: 95, align: 'left' });

    doc.fillColor(primaryColor).font('ProductSans-Bold').fontSize(10.5).text('Date:', 310, 99, { width: 130, align: 'right' });
    doc.fillColor(brandBlue).font('ProductSans-Bold').fontSize(10.5).text(dateStr, 450, 99, { width: 95, align: 'left' });

    // Divider line
    doc.moveTo(50, 125).lineTo(545, 125).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // 3. CLIENT & SYSTEM SPECIFICATIONS CARDS
    const cardY = 138;
    const cardHeight = 105;

    // Prepared For Card
    doc.roundedRect(50, cardY, 235, cardHeight, 6).fill(brandLightBlue);
    
    // Header for Prepared For
    doc.fillColor(brandBlue).rect(60, cardY + 10, 16, 16).fill();
    drawIcon(doc, ICONS.user, 62, cardY + 12, 12, '#ffffff');
    doc.fillColor(brandBlue).font('Spaced').fontSize(10.5).text('PREPARED FOR:', 82, cardY + 14);

    // Client Info details
    doc.fillColor(primaryColor).font('ProductSans-Bold').fontSize(11).text(quote.customer_name || 'N/A', 60, cardY + 36);
    doc.fillColor(textColor).font('ProductSans').fontSize(9.5).text(quote.site_address || 'N/A', 60, cardY + 52, { width: 215, lineGap: 2 });
    doc.fillColor(textColor).font('ProductSans').fontSize(9.5).text(`Contact: ${quote.contact_number || 'N/A'}`, 60, cardY + 86);

    // System Specifications Card
    doc.roundedRect(300, cardY, 245, cardHeight, 6).fill(brandLightGreen);

    // Header for Specifications
    doc.fillColor(brandGreen).rect(310, cardY + 10, 16, 16).fill();
    drawIcon(doc, ICONS.cog, 312, cardY + 12, 12, '#ffffff');
    doc.fillColor(brandGreen).font('Spaced').fontSize(10.5).text('SYSTEM SPECIFICATIONS:', 332, cardY + 14);

    // Specifications details
    const inp = quote.inputSnapshot || {};
    doc.fillColor(textColor).font('ProductSans').fontSize(9.5);
    doc.text(`Dimensions: ${inp.W}W x ${inp.D}D x ${inp.H}H (mm)`, 310, cardY + 36);
    doc.text(`Pad Thickness: ${inp.thickness || 100} mm`, 310, cardY + 50);
    doc.text(`Face Configuration: ${inp.faceSelectionType} (${(inp.faces || []).join(', ')})`, 310, cardY + 64, { width: 225 });

    // Inner green card divider
    doc.moveTo(310, cardY + 82).lineTo(535, cardY + 82).strokeColor('#c2e7d9').lineWidth(0.8).stroke();
    doc.text(`Rate Card Ref: ${quote.rate_card_version}`, 310, cardY + 88);

    // 4. COST SUMMARY TABLE
    let currentY = 262;

    // Header for Cost Summary Section
    doc.fillColor(brandBlue).rect(50, currentY, 16, 16).fill();
    drawIcon(doc, ICONS.document, 52, currentY + 2, 12, '#ffffff');
    doc.fillColor(brandBlue).font('Spaced').fontSize(11).text('COST SUMMARY', 72, currentY + 4);

    const tableTop = currentY + 22;
    const headerHeight = 22;

    // Draw main Table Header
    doc.rect(50, tableTop, 495, headerHeight).fill(brandBlue);
    doc.fillColor('#ffffff').font('ProductSans-Bold').fontSize(9.5);
    doc.text('Item Description', 60, tableTop + 7);
    doc.text('Qty', 305, tableTop + 7, { width: 35, align: 'center' });
    doc.text('Unit Price (₹)', 355, tableTop + 7, { width: 85, align: 'right' });
    doc.text('Total (₹)', 455, tableTop + 7, { width: 80, align: 'right' });

    // Table rows data
    const out = quote.outputSnapshot || {};
    const rates = quote.rates || {};

    const items = [
      { name: 'Cooling Pads', qty: out.pads ? out.pads.totalPads : 0, unit: rates.coolingPadUnitCost || 0, total: out.pads ? out.pads.cost : 0 },
      { name: 'Bottom Plate & Side Plates Sheeting', qty: out.plates ? out.plates.sheetsNeeded : 0, unit: rates.plateCostPerSheet || 0, total: out.plates ? out.plates.cost : 0 },
      { name: 'Aluminium Frame Channels', qty: out.frame ? out.frame.barsNeeded : 0, unit: rates.aluminiumCostPerBar || 0, total: out.frame ? out.frame.cost : 0 },
      { name: 'Support Patti (Vertical joint posts)', qty: out.patti ? out.patti.barsNeeded : 0, unit: rates.supportPattiCostPerBar || 0, total: out.patti ? out.patti.cost : 0 },
      { name: 'Plumbing System & Piping Fittings', qty: 1, unit: out.pumpPlumbing ? out.pumpPlumbing.plumbingCost : 0, total: out.pumpPlumbing ? out.pumpPlumbing.plumbingCost : 0 },
      { name: `Water Pump (${out.pumpPlumbing && out.pumpPlumbing.selectedPump ? out.pumpPlumbing.selectedPump.modelName : 'N/A'})`, qty: 1, unit: out.pumpPlumbing && out.pumpPlumbing.selectedPump ? out.pumpPlumbing.selectedPump.cost : 0, total: out.pumpPlumbing ? out.pumpPlumbing.pumpCost : 0 }
    ];

    let rowY = tableTop + headerHeight;
    const rowHeight = 20;

    doc.font('ProductSans').fontSize(9).fillColor(textColor);

    items.forEach((item, index) => {
      // Background shading
      if (index % 2 === 1) {
        doc.rect(50, rowY, 495, rowHeight).fill(lightBg);
      }
      
      // Row borders
      doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(borderLight).lineWidth(0.5).stroke();
      
      // Cell values
      doc.fillColor(textColor)
        .text(item.name, 60, rowY + 5)
        .text(item.qty.toString(), 305, rowY + 5, { width: 35, align: 'center' })
        .text(formatCurrency(item.unit), 355, rowY + 5, { width: 85, align: 'right' })
        .text(formatCurrency(item.total), 455, rowY + 5, { width: 80, align: 'right' });

      // Left & Right boundary lines & column separators
      doc.moveTo(50, rowY).lineTo(50, rowY + rowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();
      doc.moveTo(545, rowY).lineTo(545, rowY + rowHeight).strokeColor(borderColor).lineWidth(0.5).stroke();

      // Column vertical separators
      doc.moveTo(300, rowY).lineTo(300, rowY + rowHeight).strokeColor(borderLight).lineWidth(0.5).stroke();
      doc.moveTo(345, rowY).lineTo(345, rowY + rowHeight).strokeColor(borderLight).lineWidth(0.5).stroke();
      doc.moveTo(445, rowY).lineTo(445, rowY + rowHeight).strokeColor(borderLight).lineWidth(0.5).stroke();

      rowY += rowHeight;
    });

    // Draw bottom table boundary line
    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(borderColor).lineWidth(1).stroke();

    // Grand Total Layout Banner
    doc.rect(290, rowY + 6, 140, 24).fill(brandBlue);
    doc.rect(430, rowY + 6, 115, 24).fill(brandDarkGreen);

    doc.fillColor('#ffffff').font('ProductSans-Bold').fontSize(9.5)
       .text('GRAND TOTAL (INR)', 302, rowY + 13)
       .text(formatCurrency(out.grandTotal || 0), 435, rowY + 13, { width: 102, align: 'right' });

    // Validity Note below table
    doc.fillColor(textColor).font('ProductSans-Italic').fontSize(8.5)
       .text('* Quotation is valid for 30 days from the date of issue.', 50, rowY + 13);

    currentY = rowY + 45;

    // 5. INTERNAL ENGINEERING MATERIALS LIST
    doc.fillColor(brandBlue).rect(50, currentY, 16, 16).fill();
    drawIcon(doc, ICONS.cog, 52, currentY + 2, 12, '#ffffff');
    doc.fillColor(brandBlue).font('Spaced').fontSize(11).text('INTERNAL ENGINEERING MATERIALS LIST', 72, currentY + 4);

    const engBoxY = currentY + 22;
    const engBoxHeight = 158;

    // Main Box
    doc.roundedRect(50, engBoxY, 495, engBoxHeight, 6).fill(lightBg).strokeColor(borderColor).lineWidth(1).stroke();

    // Column 1
    const col1X = 65;
    const colTopY = engBoxY + 12;

    // Subheader: Cooling Pads Details
    drawIcon(doc, ICONS.grid, col1X, colTopY + 2, 10, brandGreen);
    doc.fillColor(brandGreen).font('Spaced').fontSize(10).text('Cooling Pads Details:', col1X + 16, colTopY + 2);
    
    doc.fillColor(textColor).font('ProductSans').fontSize(8.5);
    doc.text(`• Total pads: ${out.pads ? out.pads.totalPads : 0} sheet(s)`, col1X, colTopY + 17);
    doc.text(`• Details per selected face:`, col1X, colTopY + 27);

    let padDetailY = colTopY + 37;
    if (out.pads && out.pads.breakdown) {
      out.pads.breakdown.forEach((fd) => {
        doc.text(`  - ${fd.name}: ${fd.padsAcrossWidth}W x ${fd.padsAcrossHeight}H = ${fd.padsForFace} pads`, col1X, padDetailY);
        padDetailY += 10;
      });
    }

    // Subheader: Pumps & Plumbing Sizing
    const pumpTopY = colTopY + 84;
    drawIcon(doc, ICONS.droplet, col1X, pumpTopY + 2, 10, brandBlue);
    doc.fillColor(brandBlue).font('Spaced').fontSize(10).text('Pumps & Plumbing Sizing:', col1X + 16, pumpTopY + 2);
    
    doc.fillColor(textColor).font('ProductSans').fontSize(8.5);
    doc.text(`• Flow required: ${out.pumpPlumbing ? out.pumpPlumbing.requiredFlowLPH.toFixed(2) : 0} LPH`, col1X, pumpTopY + 17);
    doc.text(`• Selected Pump: ${out.pumpPlumbing && out.pumpPlumbing.selectedPump ? out.pumpPlumbing.selectedPump.modelName : 'N/A'}`, col1X, pumpTopY + 27);
    doc.text(`  (Capacity: ${out.pumpPlumbing && out.pumpPlumbing.selectedPump ? out.pumpPlumbing.selectedPump.capacityLPH : 0} LPH)`, col1X, pumpTopY + 37);

    // Dashed Vertical Separator Line
    doc.save();
    doc.moveTo(298, engBoxY + 10).lineTo(298, engBoxY + engBoxHeight - 10)
       .strokeColor(borderColor).lineWidth(0.8).dash(3, { space: 3 }).stroke();
    doc.restore();

    // Column 2
    const col2X = 315;
    
    // Subheader: Metal & Frame Work
    drawIcon(doc, ICONS.box, col2X, colTopY + 2, 10, brandGreen);
    doc.fillColor(brandGreen).font('Spaced').fontSize(10).text('Metal & Frame Work:', col2X + 16, colTopY + 2);

    doc.fillColor(textColor).font('ProductSans').fontSize(8.5);
    doc.text(`• Outer frame bars: ${out.frame ? out.frame.barsNeeded : 0} pcs`, col2X, colTopY + 17);
    doc.text(`  - Total Length: ${out.frame ? out.frame.totalLength.toFixed(0) : 0} mm`, col2X, colTopY + 27);
    
    doc.text(`• Patti (Vertical joints): ${out.patti ? out.patti.barsNeeded : 0} pcs`, col2X, colTopY + 41);
    doc.text(`  - Patti posts count: ${out.patti ? out.patti.postsCount : 0} pcs`, col2X, colTopY + 51);
    
    doc.text(`• Plate sheets (bottom + sides): ${out.plates ? out.plates.sheetsNeeded : 0} pcs`, col2X, colTopY + 65);
    doc.text(`  - Total Plate Area: ${out.plates ? out.plates.totalArea.toFixed(0) : 0} mm²`, col2X, colTopY + 75);

    // 6. FOOTER & DECORATIVE CORNER ACCENTS
    // Footer line
    doc.fillColor('#94a3b8').font('ProductSans').fontSize(8)
       .text('Generated automatically by Adiabatic Cooling System Quotation Automation Tool', 50, 808, { align: 'center' });

    // Decorative Angled Corner Accent Bars at the bottom
    // Left Accent (Green/Blue angle)
    doc.moveTo(0, 835).lineTo(30, 835).lineTo(45, 842).lineTo(0, 842).closePath().fill(brandBlue);
    doc.moveTo(48, 842).lineTo(65, 842).lineTo(60, 839).lineTo(45, 839).closePath().fill(brandGreen);

    // Right Accent (Blue/Green angle)
    doc.moveTo(595, 835).lineTo(565, 835).lineTo(550, 842).lineTo(595, 842).closePath().fill(brandBlue);
    doc.moveTo(547, 842).lineTo(530, 842).lineTo(535, 839).lineTo(550, 839).closePath().fill(brandGreen);

    // Finalize PDF
    doc.end();

    if (writeStream) {
      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);
    } else {
      resolve();
    }
  });
}

module.exports = {
  generateQuotePdf
};
