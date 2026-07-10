/**
 * Standalone, pure calculation engine for Adiabatic Cooling System.
 * All dimensions are in mm. All costs are in currency units.
 */

const SQMM_TO_SQFT = 92903.04; // 304.8 * 304.8

/**
 * 1. Calculate Cooling Pads
 * @param {Array} faces - Array of { name, width, height }
 * @param {number} padSheetWidth - Configured width of pad sheet
 * @param {number} padSheetHeight - Configured height of pad sheet
 */
function calculatePads(faces, padSheetWidth, padSheetHeight) {
  let totalPads = 0;
  const perFaceBreakdown = faces.map(face => {
    const padsAcrossWidth = Math.ceil(face.width / padSheetWidth);
    const padsAcrossHeight = Math.ceil(face.height / padSheetHeight);
    const padsForFace = padsAcrossWidth * padsAcrossHeight;
    totalPads += padsForFace;
    return {
      name: face.name,
      width: face.width,
      height: face.height,
      padsAcrossWidth,
      padsAcrossHeight,
      padsForFace
    };
  });

  return { totalPads, perFaceBreakdown };
}

/**
 * 2. Calculate Aluminium Frame Length and Bars Needed
 * @param {Array} faces - Array of selected faces (having name, width, height, and optionally padsAcrossWidth)
 * @param {string} faceSelectionType - '4-face' | '3-face' | '2-face-opposite' | '2-face-adjacent'
 * @param {number} H - System Height (mm)
 * @param {number} wastageFactor - wastage multiplier (e.g. 0.07)
 * @param {number} stockLength - Stock bar length (mm)
 * @param {number} padSheetWidth - Configured width of pad sheet (needed to calculate joint posts if not pre-calculated)
 */
function calculateAluminiumFrame(faces, faceSelectionType, H, wastageFactor, stockLength, padSheetWidth) {
  const bottomChannelLength = faces.reduce((sum, f) => sum + f.width, 0);
  const topCapLength = bottomChannelLength;

  // Determine corner posts
  let cornerPostCount = 0;
  const selType = faceSelectionType.toLowerCase();
  if (selType === '4-face' || selType === '3-face') {
    cornerPostCount = 4;
  } else if (selType === '2-face-opposite') {
    cornerPostCount = 4;
  } else if (selType === '2-face-adjacent') {
    cornerPostCount = 3;
  }

  const cornerPostsLength = cornerPostCount * H;

  // Support Patti length (Intermediate verticals at joints)
  let supportPattiLength = 0;
  faces.forEach(f => {
    // If padsAcrossWidth was pre-calculated, use it; otherwise compute it on the fly
    const padsAcrossWidth = f.padsAcrossWidth !== undefined
      ? f.padsAcrossWidth
      : Math.ceil(f.width / padSheetWidth);
    
    const pattiPosts = Math.max(0, padsAcrossWidth - 1);
    supportPattiLength += pattiPosts * H;
  });

  const totalRequiredLength = (bottomChannelLength + topCapLength + cornerPostsLength + supportPattiLength) * (1 + wastageFactor);
  const barsNeeded = Math.ceil(totalRequiredLength / stockLength);

  return {
    totalRequiredLength,
    barsNeeded,
    breakdown: {
      bottomChannelLength,
      topCapLength,
      cornerPostCount,
      cornerPostsLength,
      supportPattiLength
    }
  };
}

/**
 * 3. Calculate Plate Areas
 * @param {number} W - System Width (mm)
 * @param {number} D - System Depth (mm)
 * @param {Array} faces - Array of selected faces
 */
function calculatePlateAreas(W, D, faces) {
  const bottomPlateArea = W * D;
  let totalSidePlateArea = 0;
  
  const sidePlateAreas = faces.map(f => {
    const area = f.height * f.width;
    totalSidePlateArea += area;
    return { face: f.name, area };
  });

  return { bottomPlateArea, sidePlateAreas, totalSidePlateArea };
}

/**
 * 4. Calculate Pump and Plumbing System
 */
function calculatePumpAndPlumbing(totalPads, padSheetWidth, padSheetHeight, lphMultiplier, pumpModelList, plumbingCostBands) {
  const totalPadAreaSqft = totalPads * ((padSheetWidth * padSheetHeight) / SQMM_TO_SQFT);
  const requiredFlowLPH = totalPadAreaSqft * lphMultiplier;

  // Find cheapest sufficient pump (sorted by capacity ascending, then cost ascending)
  let selectedPump = null;
  if (pumpModelList && pumpModelList.length > 0) {
    const sortedPumps = [...pumpModelList]
      .filter(p => p.isActive !== false)
      .sort((a, b) => a.capacityLPH - b.capacityLPH || a.cost - b.cost);
    
    selectedPump = sortedPumps.find(p => p.capacityLPH >= requiredFlowLPH);
    if (!selectedPump) {
      selectedPump = sortedPumps[sortedPumps.length - 1]; // Fallback to largest
    }
  }

  // Find matching plumbing band
  let plumbingCost = 0;
  if (plumbingCostBands && plumbingCostBands.length > 0) {
    const sortedBands = [...plumbingCostBands].sort((a, b) => a.maxFlowLPH - b.maxFlowLPH);
    const matchedBand = sortedBands.find(b => requiredFlowLPH <= b.maxFlowLPH);
    plumbingCost = matchedBand ? matchedBand.cost : sortedBands[sortedBands.length - 1].cost;
  }

  return { requiredFlowLPH, selectedPump, plumbingCost };
}

/**
 * 5. Orchestrate Full Quotation Calculations
 */
function calculateFullQuotation(allInputs, rateCard, config, pumpModelList) {
  const { H, W, D, faces, faceSelectionType } = allInputs;

  // Resolve standard dimensions for each face
  const selectedFaces = faces.map(faceName => {
    const nameLower = faceName.toLowerCase();
    const width = (nameLower === 'front' || nameLower === 'back') ? W : D;
    return { name: faceName, width, height: H };
  });

  // 1. Pads
  const padResults = calculatePads(selectedFaces, config.padSheetWidth, config.padSheetHeight);
  const padCost = padResults.totalPads * rateCard.coolingPadUnitCost;

  // Enrich faces with pad across width for frame calculations
  const enrichedFaces = selectedFaces.map(f => {
    const padInfo = padResults.perFaceBreakdown.find(pb => pb.name === f.name);
    return { ...f, padsAcrossWidth: padInfo.padsAcrossWidth };
  });

  // 2. Frame
  const frameResults = calculateAluminiumFrame(
    enrichedFaces,
    faceSelectionType,
    H,
    rateCard.wastageFactor,
    config.aluminiumStockLength,
    config.padSheetWidth
  );
  const frameCost = frameResults.barsNeeded * rateCard.aluminiumCostPerBar;

  // Patti calculation (separate item pricing if supportPattiCostPerBar exists)
  // To match supportPattiCostPerBar separate pricing:
  const pattiPosts = enrichedFaces.reduce((sum, f) => sum + Math.max(0, f.padsAcrossWidth - 1), 0);
  const totalPattiLength = pattiPosts * H;
  const requiredPattiLength = totalPattiLength * (1 + rateCard.wastageFactor);
  const pattiBarsNeeded = Math.ceil(requiredPattiLength / config.aluminiumStockLength);
  const pattiCost = pattiBarsNeeded * rateCard.supportPattiCostPerBar;

  // Adjust frameResults to exclude support patti length from frame cost if priced separately
  // Wait, let's keep the requested logic:
  // totalRequiredLength = bottomChannel + topCap + cornerPosts + supportPatti
  // If support patti is priced separately, does it reduce the frame bars calculation?
  // Let's recalculate frame bars without patti if support patti is calculated separately.
  // Frame length without patti:
  const frameOnlyLength = (frameResults.breakdown.bottomChannelLength + frameResults.breakdown.topCapLength + frameResults.breakdown.cornerPostsLength) * (1 + rateCard.wastageFactor);
  const frameBarsNeeded = Math.ceil(frameOnlyLength / config.aluminiumStockLength);
  const adjustedFrameCost = frameBarsNeeded * rateCard.aluminiumCostPerBar;

  // 3. Plates
  const plateResults = calculatePlateAreas(W, D, selectedFaces);
  const totalPlateArea = plateResults.bottomPlateArea + plateResults.totalSidePlateArea;
  const requiredPlateArea = totalPlateArea * (1 + rateCard.wastageFactor);
  
  // Parse config plateStockSize e.g., "1220x2440"
  const [plateW, plateH] = config.plateStockSize.split('x').map(Number);
  const plateSheetArea = plateW * plateH;
  const plateSheetsNeeded = Math.ceil(requiredPlateArea / plateSheetArea);
  const plateCost = plateSheetsNeeded * rateCard.plateCostPerSheet;

  // 4. Pump & Plumbing
  const pumpPlumbingResults = calculatePumpAndPlumbing(
    padResults.totalPads,
    config.padSheetWidth,
    config.padSheetHeight,
    rateCard.lphMultiplier,
    pumpModelList,
    rateCard.plumbingCostBands
  );
  
  const pumpCost = pumpPlumbingResults.selectedPump ? pumpPlumbingResults.selectedPump.cost : 0;
  const plumbingCost = pumpPlumbingResults.plumbingCost;

  // 5. Grand Total
  const grandTotal = padCost + adjustedFrameCost + pattiCost + plateCost + pumpCost + plumbingCost;

  return {
    inputs: allInputs,
    pads: {
      totalPads: padResults.totalPads,
      cost: padCost,
      breakdown: padResults.perFaceBreakdown
    },
    frame: {
      barsNeeded: frameBarsNeeded,
      cost: adjustedFrameCost,
      totalLength: frameOnlyLength
    },
    patti: {
      barsNeeded: pattiBarsNeeded,
      cost: pattiCost,
      postsCount: pattiPosts
    },
    plates: {
      sheetsNeeded: plateSheetsNeeded,
      cost: plateCost,
      totalArea: totalPlateArea
    },
    pumpPlumbing: {
      requiredFlowLPH: pumpPlumbingResults.requiredFlowLPH,
      selectedPump: pumpPlumbingResults.selectedPump,
      plumbingCost,
      pumpCost
    },
    grandTotal
  };
}

module.exports = {
  calculatePads,
  calculateAluminiumFrame,
  calculatePlateAreas,
  calculatePumpAndPlumbing,
  calculateFullQuotation
};
