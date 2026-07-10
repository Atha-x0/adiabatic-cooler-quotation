const { initDb, getQuery, runQuery } = require('./db/connection');
const { calculateFullQuotation } = require('./calculations/calculationEngine');
const { generateQuotePdf } = require('./pdf-generator');
const path = require('path');
const fs = require('fs');

async function main() {
  await initDb();
  
  const inputSnapshot = {
    H: 2000,
    W: 2000,
    D: 2000,
    faces: ['Front', 'Back', 'Left', 'Right'],
    faceSelectionType: '4-face',
    thickness: 150
  };

  const rateCard = {
    version_label: "v1",
    plumbingCostBands: [
      { maxFlowLPH: 5000, cost: 300 },
      { maxFlowLPH: 10000, cost: 500 }
    ],
    coolingPadUnitCost: 150,
    aluminiumCostPerBar: 80,
    plateCostPerSheet: 200,
    supportPattiCostPerBar: 60,
    wastageFactor: 0.07,
    lphMultiplier: 4.0
  };

  const config = {
    padSheetWidth: 1180,
    padSheetHeight: 2000,
    aluminiumStockLength: 3660,
    plateStockSize: "1220x2440",
    wastageFactor: "0.07",
    lphMultiplier: "4"
  };

  const pumps = [
    { id: 1, modelName: "Pump A 2000LPH", capacityLPH: 2000, cost: 100, isActive: true },
    { id: 2, modelName: "Pump B 5000LPH", capacityLPH: 5000, cost: 250, isActive: true },
    { id: 3, modelName: "Pump C 10000LPH", capacityLPH: 10000, cost: 450, isActive: true }
  ];

  const outputSnapshot = calculateFullQuotation(inputSnapshot, rateCard, config, pumps);

  const mockQuote = {
    id: 999,
    created_at: new Date().toISOString(),
    customer_name: "Test Customer Inc.",
    site_address: "123 Industrial Park, Block B",
    contact_number: "+1 234 567 8900",
    rate_card_version: "v1",
    inputSnapshot,
    outputSnapshot,
    rates: rateCard
  };

  const filePath = path.join(__dirname, 'pdfs', 'sample-test-case-1.pdf');
  await generateQuotePdf(mockQuote, null, filePath);
  console.log("Generated sample PDF at", filePath);
}

main().catch(console.error);
