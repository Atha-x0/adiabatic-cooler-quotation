const PDFDocument = require('pdfkit');

/**
 * Generate a PDF quotation and write it to the response stream.
 * @param {object} quote - The quotation record from the database (including customer info)
 * @param {object} res - Express response stream
 */
function generateQuotePdf(quote, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe to response
  doc.pipe(res);

  // Colors
  const primaryColor = '#1e293b'; // Slate 800
  const secondaryColor = '#0f766e'; // Teal 700
  const textColor = '#334155'; // Slate 700
  const lightBg = '#f8fafc'; // Slate 50
  const borderColor = '#cbd5e1'; // Slate 300

  // 1. HEADER / BRANDING
  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('ADIABATIC COOLING SYSTEMS', 50, 45)
    .fontSize(10)
    .fillColor(textColor)
    .font('Helvetica')
    .text('Industrial Pad System Fabrication & Installation', 50, 70)
    .text('Email: engineering@adiabaticcooling.com | Tel: +1 (555) 0199', 50, 82);

  // Quote Title
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('QUOTATION', 400, 45, { align: 'right' })
    .font('Helvetica')
    .fontSize(10)
    .fillColor(textColor)
    .text(`Quote #: ${quote.quote_number}`, 400, 65, { align: 'right' })
    .text(`Date: ${quote.date}`, 400, 77, { align: 'right' });

  // Divider line
  doc.moveTo(50, 105).lineTo(545, 105).strokeColor(borderColor).lineWidth(1).stroke();

  // 2. CLIENT & PROJECT METADATA
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(primaryColor)
    .text('PREPARED FOR:', 50, 120)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(textColor)
    .text(quote.customer_name || 'N/A', 50, 135)
    .text(quote.site_address || 'N/A', 50, 147, { width: 230 })
    .text(`Contact: ${quote.contact_info || 'N/A'}`, 50, 185);

  // System Specifications Column
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(primaryColor)
    .text('SYSTEM SPECIFICATIONS:', 320, 120)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(textColor)
    .text(`Dimensions: ${quote.width}W x ${quote.depth}D x ${quote.height}H (mm)`, 320, 135)
    .text(`Pad Thickness: ${quote.pad_thickness} mm`, 320, 147)
    .text(`Face Configuration: ${quote.face_config_type} (${quote.faces.join(', ')})`, 320, 159, { width: 220 })
    .text(`Rate Card Ref: ${quote.rate_card_version}`, 320, 185);

  // Divider line
  doc.moveTo(50, 205).lineTo(545, 205).strokeColor(borderColor).stroke();

  // 3. CUSTOMER PRICING SUMMARY (Line-itemized)
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(primaryColor)
    .text('COST SUMMARY', 50, 220);

  // Table Headers
  const tableTop = 240;
  doc
    .rect(50, tableTop, 495, 20)
    .fill(primaryColor);

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('Item Description', 60, tableTop + 6)
    .text('Qty', 320, tableTop + 6, { width: 30, align: 'center' })
    .text('Unit Price', 370, tableTop + 6, { width: 70, align: 'right' })
    .text('Total', 460, tableTop + 6, { width: 80, align: 'right' });

  // Draw table rows
  const breakdown = quote.breakdown;
  const items = [
    { name: 'Cooling Pads', qty: breakdown.totalPads, unit: quote.rates.padCostPerSheet, total: breakdown.padCost },
    { name: 'Bottom Plate & Side Plates', qty: breakdown.plates.plateSheetsNeeded, unit: quote.rates.plateCostPerSheet, total: breakdown.plates.plateCost },
    { name: 'Aluminium Frame Channels', qty: breakdown.frame.frameBarsNeeded, unit: quote.rates.aluCostPerBar, total: breakdown.frame.frameCost },
    { name: 'Support Patti (Intermediate Verticals)', qty: breakdown.patti.pattiBarsNeeded, unit: quote.rates.pattiCostPerBar, total: breakdown.patti.pattiCost },
    { name: 'Plumbing System & Piping Fittings', qty: 1, unit: breakdown.plumbing.plumbingCost, total: breakdown.plumbing.plumbingCost },
    { name: `Water Pump (${breakdown.plumbing.selectedPumpName})`, qty: 1, unit: breakdown.plumbing.pumpCost, total: breakdown.plumbing.pumpCost }
  ];

  let currentY = tableTop + 20;
  doc.font('Helvetica').fontSize(9).fillColor(textColor);

  items.forEach((item, index) => {
    // Zebra striping background
    if (index % 2 === 1) {
      doc.rect(50, currentY, 495, 20).fill(lightBg);
    }
    
    doc
      .fillColor(textColor)
      .text(item.name, 60, currentY + 6)
      .text(item.qty.toString(), 320, currentY + 6, { width: 30, align: 'center' })
      .text(`₹${item.unit.toFixed(2)}`, 370, currentY + 6, { width: 70, align: 'right' })
      .text(`₹${item.total.toFixed(2)}`, 460, currentY + 6, { width: 80, align: 'right' });

    // Draw bottom border
    doc.moveTo(50, currentY + 20).lineTo(545, currentY + 20).strokeColor(borderColor).lineWidth(0.5).stroke();
    currentY += 20;
  });

  // Grand Total Row
  doc
    .rect(320, currentY + 5, 225, 25)
    .fill(secondaryColor);

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('GRAND TOTAL (INR)', 330, currentY + 12)
    .text(`₹${quote.grand_total.toFixed(2)}`, 450, currentY + 12, { width: 90, align: 'right' });

  currentY += 45;

  // 4. ENGINEERING MATERIALS BREAKDOWN (For engineers/installers only)
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('INTERNAL ENGINEERING MATERIALS LIST', 50, currentY);
  
  currentY += 15;

  // Box background for materials list
  doc
    .rect(50, currentY, 495, 140)
    .fill(lightBg)
    .strokeColor(borderColor)
    .lineWidth(1)
    .stroke();

  doc.fillColor(textColor).font('Helvetica').fontSize(9);

  // Column 1
  let col1Y = currentY + 10;
  doc
    .font('Helvetica-Bold').text('Cooling Pads Details:', 60, col1Y)
    .font('Helvetica')
    .text(`• Total pads: ${breakdown.totalPads} sheet(s) (${quote.rates.padSheetWidth}x${quote.rates.padSheetHeight}mm)`, 60, col1Y + 15)
    .text(`• Pad details per face:`, 60, col1Y + 27);

  breakdown.padDetails.forEach((fd, i) => {
    doc.text(`  - ${fd.face}: ${fd.padsAcrossWidth}W x ${fd.padsAcrossHeight}H = ${fd.padsForFace} pads`, 65, col1Y + 39 + (i * 12));
  });

  // Column 2
  let col2Y = currentY + 10;
  doc
    .font('Helvetica-Bold').text('Metal & Frame Work:', 300, col2Y)
    .font('Helvetica')
    .text(`• Outer frame bars: ${breakdown.frame.frameBarsNeeded} pcs (${quote.rates.aluStockLength}mm)`, 300, col2Y + 15)
    .text(`  - Bottom/Top channel: ${breakdown.frame.bottomChannelLength} mm each`, 300, col2Y + 27)
    .text(`  - Corner posts: ${breakdown.frame.cornerPostCount} pcs (length: ${quote.height}mm)`, 300, col2Y + 39)
    .text(`• Patti (Intermediate verticals): ${breakdown.patti.pattiBarsNeeded} pcs`, 300, col2Y + 51)
    .text(`  - Total post count: ${breakdown.patti.totalPattiPosts} pcs (length: ${quote.height}mm)`, 300, col2Y + 63)
    .text(`• Plate sheets (bottom + sides): ${breakdown.plates.plateSheetsNeeded} pcs`, 300, col2Y + 75)
    .text(`  - Dimensions: ${quote.rates.plateSheetWidth}x${quote.rates.plateSheetHeight}mm`, 300, col2Y + 87);

  // Plumbing Info bottom
  doc
    .font('Helvetica-Bold').text('Pumps & Plumbing Sizing:', 60, currentY + 105)
    .font('Helvetica')
    .text(`• Total pad area: ${breakdown.plumbing.totalPadAreaSqft.toFixed(2)} sqft`, 60, currentY + 118)
    .text(`• Required flow: ${breakdown.plumbing.requiredFlowRateLPH.toFixed(2)} LPH (at ${quote.rates.lphMultiplier} LPH/sqft)`, 250, currentY + 118)
    .text(`• Selected Pump: ${breakdown.plumbing.selectedPumpName} (Capacity: ${breakdown.plumbing.selectedPumpCapacity} LPH)`, 60, currentY + 128);

  // Footer note
  doc
    .fontSize(8)
    .fillColor('#94a3b8')
    .text('Generated automatically by Adiabatic Cooling System Quotation Automation Tool', 50, 780, { align: 'center' });

  // Finalize PDF
  doc.end();
}

module.exports = {
  generateQuotePdf
};
