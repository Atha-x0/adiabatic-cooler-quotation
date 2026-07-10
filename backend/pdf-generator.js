const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF quotation and write it to the response stream or file system.
 * @param {object} quote - The quotation record from the database (including customer info and snapshot)
 * @param {object} res - Express response stream (optional)
 * @param {string} filePath - Local file path to save to (optional)
 */
function generateQuotePdf(quote, res = null, filePath = null) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    let writeStream;
    if (filePath) {
      // Ensure directory exists
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

  // Colors
  const primaryColor = '#1e293b'; // Slate 800
  const secondaryColor = '#0f766e'; // Teal 700
  const textColor = '#334155'; // Slate 700
  const lightBg = '#f8fafc'; // Slate 50
  const borderColor = '#cbd5e1'; // Slate 300

  // Formatting date
  const dateStr = new Date(quote.created_at || Date.now()).toLocaleDateString();
  const quoteNum = `Q-${new Date(quote.created_at || Date.now()).toISOString().slice(0, 10).replace(/-/g, '')}-${String(quote.id).padStart(4, '0')}`;

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
    .text(`Email: engineering@adiabaticcooling.com | Tel: +1 (555) 0199`, 50, 82);

  // Quote Title
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('QUOTATION', 400, 45, { align: 'right' })
    .font('Helvetica')
    .fontSize(10)
    .fillColor(textColor)
    .text(`Quote #: ${quoteNum}`, 400, 65, { align: 'right' })
    .text(`Date: ${dateStr}`, 400, 77, { align: 'right' });

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
    .text(`Contact: ${quote.contact_number || 'N/A'}`, 50, 185);

  // System Specifications Column
  const inp = quote.inputSnapshot || {};
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(primaryColor)
    .text('SYSTEM SPECIFICATIONS:', 320, 120)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(textColor)
    .text(`Dimensions: ${inp.W}W x ${inp.D}D x ${inp.H}H (mm)`, 320, 135)
    .text(`Pad Thickness: ${inp.thickness || 100} mm`, 320, 147)
    .text(`Face Configuration: ${inp.faceSelectionType} (${(inp.faces || []).join(', ')})`, 320, 159, { width: 220 })
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
      .text(`₹${(item.unit || 0).toFixed(2)}`, 370, currentY + 6, { width: 70, align: 'right' })
      .text(`₹${(item.total || 0).toFixed(2)}`, 460, currentY + 6, { width: 80, align: 'right' });

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
    .text(`₹${(out.grandTotal || 0).toFixed(2)}`, 450, currentY + 12, { width: 90, align: 'right' });

  currentY += 35;

  // Validity Note
  doc
    .fillColor(textColor)
    .font('Helvetica-Oblique')
    .fontSize(9)
    .text('* Quotation is valid for 30 days from the date of issue.', 50, currentY);

  currentY += 30;

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
    .text(`• Total pads: ${out.pads ? out.pads.totalPads : 0} sheet(s)`, 60, col1Y + 15)
    .text(`• Details per selected face:`, 60, col1Y + 27);

  if (out.pads && out.pads.breakdown) {
    out.pads.breakdown.forEach((fd, i) => {
      doc.text(`  - ${fd.name}: ${fd.padsAcrossWidth}W x ${fd.padsAcrossHeight}H = ${fd.padsForFace} pads`, 65, col1Y + 39 + (i * 12));
    });
  }

  // Column 2
  let col2Y = currentY + 10;
  doc
    .font('Helvetica-Bold').text('Metal & Frame Work:', 300, col2Y)
    .font('Helvetica')
    .text(`• Outer frame bars: ${out.frame ? out.frame.barsNeeded : 0} pcs`, 300, col2Y + 15)
    .text(`  - Total Length: ${out.frame ? out.frame.totalLength.toFixed(0) : 0} mm`, 300, col2Y + 27)
    .text(`• Patti (Vertical joints): ${out.patti ? out.patti.barsNeeded : 0} pcs`, 300, col2Y + 39)
    .text(`  - Patti posts count: ${out.patti ? out.patti.postsCount : 0} pcs`, 300, col2Y + 51)
    .text(`• Plate sheets (bottom + sides): ${out.plates ? out.plates.sheetsNeeded : 0} pcs`, 300, col2Y + 63)
    .text(`  - Total Plate Area: ${out.plates ? out.plates.totalArea.toFixed(0) : 0} mm²`, 300, col2Y + 75);

  // Plumbing Info bottom
  doc
    .font('Helvetica-Bold').text('Pumps & Plumbing Sizing:', 60, currentY + 105)
    .font('Helvetica')
    .text(`• Flow required: ${out.pumpPlumbing ? out.pumpPlumbing.requiredFlowLPH.toFixed(2) : 0} LPH`, 60, currentY + 118)
    .text(`• Selected Pump: ${out.pumpPlumbing && out.pumpPlumbing.selectedPump ? out.pumpPlumbing.selectedPump.modelName : 'N/A'} (Capacity: ${out.pumpPlumbing && out.pumpPlumbing.selectedPump ? out.pumpPlumbing.selectedPump.capacityLPH : 0} LPH)`, 60, currentY + 128);

  // Footer note
  doc
    .fontSize(8)
    .fillColor('#94a3b8')
    .text('Generated automatically by Adiabatic Cooling System Quotation Automation Tool', 50, 780, { align: 'center' });

  // Finalize PDF
  doc.end();

  if (writeStream) {
    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  } else {
    // If we only piped to res, just resolve immediately
    resolve();
  }
  });
}

module.exports = {
  generateQuotePdf
};
