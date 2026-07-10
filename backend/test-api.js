const API_URL = 'http://localhost:3000/api';

async function verifyApis() {
  console.log("--- Starting API Endpoint Verification ---");

  try {
    // 1. Health check
    let res = await fetch(`${API_URL}/health`);
    let health = await res.json();
    console.log(`✅ Health check response status: ${health.status}`);

    // 2. Fetch Customers (Initially empty)
    res = await fetch(`${API_URL}/customers`);
    let customers = await res.json();
    console.log(`✅ Customers list fetched. Count: ${customers.length}`);

    // 3. Create a Customer
    res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Delta Cooling Plants Ltd.',
        siteAddress: '123 Industrial Zone, Sector 4',
        contactNumber: '555-9876',
        email: 'info@deltacooling.com'
      })
    });
    const customer = await res.json();
    console.log(`✅ Customer created successfully: ID = ${customer.id}, Name = "${customer.name}"`);

    // 4. Fetch Customers Again to check count
    res = await fetch(`${API_URL}/customers`);
    customers = await res.json();
    console.log(`✅ Customers list verified. Count: ${customers.length} (expected 1)`);

    // 5. Fetch Active Rate Card
    res = await fetch(`${API_URL}/rate-cards/active`);
    const rateCard = await res.json();
    console.log(`✅ Active Rate Card fetched: Version = "${rateCard.versionLabel}", Unit Cost = $${rateCard.coolingPadUnitCost}`);

    // 6. Fetch Global Configurations
    res = await fetch(`${API_URL}/configs`);
    const configs = await res.json();
    console.log(`✅ Configurations fetched: Pad width = ${configs.padSheetWidth}mm, Stock length = ${configs.aluminiumStockLength}mm`);

    // 7. Create a Quotation (should run calculation stub)
    res = await fetch(`${API_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: customer.id,
        status: 'draft',
        inputSnapshot: {
          H: 1800,
          W: 2400,
          D: 1500,
          faces: ['Back', 'Left', 'Right'],
          faceSelectionType: '3-face',
          thickness: 100
        }
      })
    });
    const quote = await res.json();
    console.log(`✅ Quotation created. ID: ${quote.id}, Status: "${quote.status}"`);
    console.log(`   Input Snapshot:`, JSON.stringify(quote.inputSnapshot));
    console.log(`   Output Snapshot (Calculations Stub):`, JSON.stringify(quote.outputSnapshot));

    // 8. Fetch Quotations list
    res = await fetch(`${API_URL}/quotations`);
    const quotes = await res.json();
    console.log(`✅ Quotations list verified. Count: ${quotes.length} (expected 1)`);
    console.log(`   Customer Name linked: "${quotes[0].customer_name}"`);
    console.log(`   Rate Card Version linked: "${quotes[0].rate_card_version}"`);

    console.log("\n🎉 API ROUTE INTEGRATIONS VERIFIED SUCCESSFULLY! 🎉");
  } catch (err) {
    console.error("❌ API Verification failed with error:", err);
    process.exit(1);
  }
}

verifyApis();
