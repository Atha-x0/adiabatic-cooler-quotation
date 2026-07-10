const {
  calculatePads,
  calculateAluminiumFrame,
  calculatePlateAreas,
  calculatePumpAndPlumbing,
  calculateFullQuotation
} = require('./calculations/calculationEngine');

// Setup standard configuration constants (W x H or Stock sizes)
const config = {
  padSheetWidth: 1180,
  padSheetHeight: 2000,
  aluminiumStockLength: 3660,
  plateStockSize: '1220x2440'
};

// Setup standard rate card
const rateCard = {
  coolingPadUnitCost: 150.00,
  aluminiumCostPerBar: 80.00,
  plateCostPerSheet: 200.00,
  supportPattiCostPerBar: 60.00,
  wastageFactor: 0.07,
  lphMultiplier: 4.0,
  plumbingCostBands: [
    { minFlowLPH: 0, maxFlowLPH: 1000, cost: 100.00 },
    { minFlowLPH: 1000, maxFlowLPH: 4000, cost: 250.00 },
    { minFlowLPH: 4000, maxFlowLPH: 10000, cost: 500.00 }
  ]
};

// Setup standard pump model list
const pumpModelList = [
  { modelName: 'EcoFlow 1000', capacityLPH: 1000, cost: 200.00, isActive: true },
  { modelName: 'EcoFlow 3000', capacityLPH: 3000, cost: 400.00, isActive: true },
  { modelName: 'EcoFlow 6000', capacityLPH: 6000, cost: 700.00, isActive: true }
];

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

// -----------------------------------------------------------------
// TEST CASE 1 (3-Face U-shape system)
// -----------------------------------------------------------------
console.log("\n--- Running Test Case 1 (3-Face U-Shape) ---");
const inputs1 = {
  H: 1800,
  W: 2400,
  D: 1500,
  faces: ['Back', 'Left', 'Right'],
  faceSelectionType: '3-face'
};

const result1 = calculateFullQuotation(inputs1, rateCard, config, pumpModelList);

assert(result1.pads.totalPads === 7, `Expected totalPads = 7, got ${result1.pads.totalPads}`);
assert(result1.frame.barsNeeded === 6, `Expected frame barsNeeded = 6, got ${result1.frame.barsNeeded}`);
assert(result1.patti.barsNeeded === 3, `Expected patti barsNeeded = 3, got ${result1.patti.barsNeeded}`);
assert(result1.plates.sheetsNeeded === 5, `Expected plate sheetsNeeded = 5, got ${result1.plates.sheetsNeeded}`);
assert(result1.pumpPlumbing.selectedPump.modelName === 'EcoFlow 1000', `Expected pump EcoFlow 1000, got ${result1.pumpPlumbing.selectedPump.modelName}`);
assert(result1.grandTotal === 3010, `Expected grandTotal = 3010, got ${result1.grandTotal}`);


// -----------------------------------------------------------------
// TEST CASE 2 (4-Face Wrap system)
// -----------------------------------------------------------------
console.log("\n--- Running Test Case 2 (4-Face Wrap) ---");
const inputs2 = {
  H: 2000,
  W: 3000,
  D: 2000,
  faces: ['Front', 'Back', 'Left', 'Right'],
  faceSelectionType: '4-face'
};

const result2 = calculateFullQuotation(inputs2, rateCard, config, pumpModelList);

assert(result2.pads.totalPads === 10, `Expected totalPads = 10, got ${result2.pads.totalPads}`);
assert(result2.frame.barsNeeded === 9, `Expected frame barsNeeded = 9, got ${result2.frame.barsNeeded}`);
assert(result2.patti.barsNeeded === 4, `Expected patti barsNeeded = 4, got ${result2.patti.barsNeeded}`);
assert(result2.plates.sheetsNeeded === 10, `Expected plate sheetsNeeded = 10, got ${result2.plates.sheetsNeeded}`);
assert(result2.pumpPlumbing.selectedPump.modelName === 'EcoFlow 3000', `Expected pump EcoFlow 3000, got ${result2.pumpPlumbing.selectedPump.modelName}`);
assert(result2.grandTotal === 5110, `Expected grandTotal = 5110, got ${result2.grandTotal}`);

console.log("\n🎉 ALL STANDALONE CALCULATION ENGINE TESTS PASSED! 🎉");
