import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import PDFDocument from "pdfkit";

let mongo;
let app;
let token;
let customer;
let vehicle;
let order;
let estimate;
let scannerReport;
let inventoryPart;

function createPdfBuffer(lines) {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    for (const line of lines) doc.text(line);
    doc.end();
  });
}

before(async () => {
  process.env.JWT_SECRET = "integration-test-secret";
  process.env.ADMIN_EMAIL = "admin@yerosautoservices.com";
  process.env.ADMIN_PASSWORD = "Admin123!";
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("yerosautoservices"));
  const appModule = await import("../src/app.js");
  app = appModule.createApp();
  await appModule.ensureAdmin();
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test("health endpoint is public", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.equal(response.body.status, "ok");
});

test("admin can log in", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@yerosautoservices.com", password: "Admin123!" })
    .expect(200);
  assert.ok(response.body.token);
  token = response.body.token;
});

test("customer CRUD works", async () => {
  const created = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test Customer", phone: "555-0100", email: "customer@example.com" })
    .expect(201);
  customer = created.body;
  assert.equal(customer.name, "Test Customer");

  const updated = await request(app)
    .put(`/api/customers/${customer._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Updated Customer" })
    .expect(200);
  assert.equal(updated.body.name, "Updated Customer");
});

test("customer search and service history work", async () => {
  const search = await request(app)
    .get("/api/customers?search=updated")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(search.body.length, 1);

  const emptyHistory = await request(app)
    .get(`/api/customers/${customer._id}/history`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(emptyHistory.body.vehicles.length, 0);
});

test("assistant reports configuration without exposing a key", async () => {
  delete process.env.OPENAI_API_KEY;
  const status = await request(app)
    .get("/api/assistant/status")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(status.body.configured, false);
  assert.equal(status.body.apiKey, undefined);

  await request(app)
    .post("/api/assistant")
    .set("Authorization", `Bearer ${token}`)
    .send({ question: "What causes P0300?" })
    .expect(503);
});

test("vehicle CRUD works", async () => {
  const created = await request(app)
    .post("/api/vehicles")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customer._id,
      year: 2022,
      make: "Toyota",
      model: "Camry",
      engine: "2.5L I4",
      mileage: 25000,
      oilChange: { lastMileage: 22000, intervalMiles: 3000, intervalMonths: 3 },
    })
    .expect(201);
  vehicle = created.body;
  assert.equal(vehicle.customer._id, customer._id);
  assert.equal(vehicle.engine, "2.5L I4");
  assert.equal(vehicle.oilChangeStatus.status, "overdue");
  assert.equal(vehicle.oilChangeStatus.nextMileage, 25000);

  const updated = await request(app)
    .put(`/api/vehicles/${vehicle._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ mileage: 25100, oilChange: { lastMileage: 25100, intervalMiles: 3000, intervalMonths: 3 } })
    .expect(200);
  assert.equal(updated.body.mileage, 25100);
  assert.equal(updated.body.oilChangeStatus.status, "current");
  assert.equal(updated.body.oilChangeStatus.nextMileage, 28100);
});

test("work order CRUD and totals work", async () => {
  const created = await request(app)
    .post("/api/work-orders")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customer._id,
      vehicle: vehicle._id,
      services: [{ description: "Oil change", quantity: 1, price: 50, cost: 20 }],
      dtcCodes: [{ code: "P0300", description: "Random misfire", status: "active" }],
      oilChange: { performed: true, mileage: 26000, intervalMiles: 5000, intervalMonths: 6, notes: "5W-20 synthetic" },
      labor: 25,
      taxRate: 10,
      paymentMethod: "Zelle",
    })
    .expect(201);
  order = created.body;
  assert.equal(order.total, 82.5);
  assert.equal(order.partsCost, 20);
  assert.equal(order.grossProfit, 55);
  assert.equal(order.dtcCodes[0].code, "P0300");
  assert.equal(order.paymentMethod, "Zelle");
  assert.equal(order.oilChange.performed, true);

  const updated = await request(app)
    .put(`/api/work-orders/${order._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "completed" })
    .expect(200);
  assert.equal(updated.body.status, "completed");
  assert.ok(updated.body.completedAt);

  const vehicleAfterOilChange = await request(app)
    .get(`/api/vehicles/${vehicle._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(vehicleAfterOilChange.body.vehicle.mileage, 26000);
  assert.equal(vehicleAfterOilChange.body.vehicle.oilChange.lastMileage, 26000);
  assert.equal(vehicleAfterOilChange.body.vehicle.oilChange.intervalMiles, 5000);
  assert.equal(vehicleAfterOilChange.body.vehicle.oilChangeStatus.nextMileage, 31000);
  assert.equal(vehicleAfterOilChange.body.vehicle.oilChangeHistory.length, 1);
  assert.equal(vehicleAfterOilChange.body.vehicle.oilChangeHistory[0].mileage, 26000);
  assert.equal(vehicleAfterOilChange.body.vehicle.oilChangeHistory[0].orderNumber, order.orderNumber);
});

test("customer history includes vehicles and repairs", async () => {
  const history = await request(app)
    .get(`/api/customers/${customer._id}/history`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(history.body.vehicles.length, 1);
  assert.equal(history.body.orders.length, 1);
  assert.equal(history.body.orders[0].orderNumber, order.orderNumber);
});

test("work order list supports fast pagination and filters", async () => {
  const page = await request(app)
    .get(`/api/work-orders?page=1&limit=10&status=completed&search=${encodeURIComponent(order.orderNumber)}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(page.body.items.length, 1);
  assert.equal(page.body.items[0].orderNumber, order.orderNumber);
  assert.equal(page.body.pagination.total, 1);
  assert.equal(page.body.pagination.pages, 1);
});

test("customer and vehicle detail pages have related records", async () => {
  const customerDetail = await request(app)
    .get(`/api/customers/${customer._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(customerDetail.body.vehicles.length, 1);
  assert.equal(customerDetail.body.orders.length, 1);

  const vehicleDetail = await request(app)
    .get(`/api/vehicles/${vehicle._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(vehicleDetail.body.vehicle.customer.name, "Updated Customer");
  assert.equal(vehicleDetail.body.orders.length, 1);
});

test("scanner reports track Autel scans and convert to work orders", async () => {
  const autelPdf = await createPdfBuffer([
    "Autel Diagnostic Report",
    "Scanner: Autel MK900",
    "VIN: 4T1C11AK0NU123456",
    "Odometer Reading: 25,250.6 mi",
    "ECM P0420 Catalyst efficiency below threshold",
    "BCM B1000 Body control module stored code",
    "PCM P0300 Random misfire detected",
  ]);

  const preview = await request(app)
    .post("/api/scanner-reports/preview")
    .set("Authorization", `Bearer ${token}`)
    .send({
      reportFileName: "autel-test-report.pdf",
      reportFileData: `data:application/pdf;base64,${autelPdf.toString("base64")}`,
    })
    .expect(200);
  assert.equal(preview.body.vin, "4T1C11AK0NU123456");
  assert.equal(preview.body.mileage, 25250);
  assert.deepEqual(preview.body.dtcCodes.map((dtc) => dtc.code), ["P0300", "B1000", "P0420"]);

  const created = await request(app)
    .post("/api/scanner-reports")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customer._id,
      vehicle: vehicle._id,
      scannerModel: "Autel MK900",
      sourceFileName: "autel-test-report.pdf",
      reportFileName: "autel-test-report.pdf",
      reportFileData: `data:application/pdf;base64,${autelPdf.toString("base64")}`,
    })
    .expect(201);
  scannerReport = created.body;
  assert.equal(scannerReport.reportNumber, "SCAN-00001");
  assert.equal(scannerReport.vin, "4T1C11AK0NU123456");
  assert.equal(scannerReport.mileage, 25250);
  assert.deepEqual(scannerReport.dtcCodes.map((dtc) => dtc.module), ["PCM", "BCM", "ECM"]);
  assert.deepEqual(scannerReport.dtcCodes.map((dtc) => dtc.code), ["P0300", "B1000", "P0420"]);
  assert.equal(scannerReport.reportFile.fileName, "autel-test-report.pdf");
  assert.equal(scannerReport.reportFile.data, undefined);

  const detail = await request(app)
    .get(`/api/scanner-reports/${scannerReport._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(detail.body.rawText.includes("Odometer Reading"), true);
  assert.equal(detail.body.reportFile.data, undefined);

  const pdf = await request(app)
    .get(`/api/scanner-reports/${scannerReport._id}/file`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", "application/pdf");
  assert.ok(pdf.body.length > 1000);

  const vehicleDetail = await request(app)
    .get(`/api/vehicles/${vehicle._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(vehicleDetail.body.vehicle.vin, "4T1C11AK0NU123456");
  assert.equal(vehicleDetail.body.vehicle.mileage, 26000);
  assert.equal(vehicleDetail.body.scannerReports.length, 1);

  const converted = await request(app)
    .post(`/api/scanner-reports/${scannerReport._id}/work-order`)
    .set("Authorization", `Bearer ${token}`)
    .expect(201);
  assert.equal(converted.body.dtcCodes[0].code, "P0300");

  const reports = await request(app)
    .get(`/api/scanner-reports?vehicle=${vehicle._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(reports.body[0].convertedWorkOrder.orderNumber, converted.body.orderNumber);
});

test("receipt reader extracts receipt lines from PDFs", async () => {
  const receiptPdf = await createPdfBuffer([
    "AutoZone Receipt",
    "STP Extended Life Engine Oil Filter Element S11665XL $9.65",
    "Mobil 1 Advanced Full Synthetic 5W-20 Motor Oil 1 Quart $12.99",
    "Mobil 1 High Mileage Full Synthetic 5W-20 Motor Oil 1 Quart qty 2 $25.98",
    "Subtotal $48.62",
  ]);

  const preview = await request(app)
    .post("/api/receipt-reader/preview")
    .set("Authorization", `Bearer ${token}`)
    .send({
      receiptFileName: "autozone-receipt.pdf",
      receiptFileData: `data:application/pdf;base64,${receiptPdf.toString("base64")}`,
    })
    .expect(200);

  assert.equal(preview.body.vendor, "AutoZone");
  assert.equal(preview.body.sourceFileName, "autozone-receipt.pdf");
  assert.deepEqual(preview.body.items.map((item) => item.description), [
    "STP Extended Life Engine Oil Filter Element S11665XL",
    "Mobil 1 Advanced Full Synthetic 5W-20 Motor Oil 1 Quart",
    "Mobil 1 High Mileage Full Synthetic 5W-20 Motor Oil 1 Quart",
  ]);
  assert.equal(preview.body.items[2].quantity, 2);
  assert.equal(preview.body.items[2].unitPrice, 12.99);
  assert.equal(preview.body.items[2].lineTotal, 25.98);
});

test("work order detail and deep search work", async () => {
  const detail = await request(app)
    .get(`/api/work-orders/${order._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(detail.body.customer.name, "Updated Customer");
  assert.equal(detail.body.vehicle.vin, "4T1C11AK0NU123456");
  assert.equal(detail.body.dtcCodes[0].code, "P0300");

  const byDtc = await request(app)
    .get("/api/search?q=P0300")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(byDtc.body.workOrders.length, 2);

  const byCustomer = await request(app)
    .get("/api/search?q=Updated")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(byCustomer.body.customers.length, 1);
  assert.equal(byCustomer.body.vehicles.length, 1);
  assert.equal(byCustomer.body.workOrders.length, 2);
});
test("invoice PDF is generated", async () => {
  const response = await request(app)
    .get(`/api/work-orders/${order._id}/invoice`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", "application/pdf");
  assert.ok(response.body.length > 1000);
  const pdfText = response.body.toString("latin1");
  assert.equal((pdfText.match(/\/Type\s*\/Page\b/g) || []).length, 1);
});

test("estimate CRUD, PDF and conversion work", async () => {
  const created = await request(app)
    .post("/api/estimates")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customer: customer._id,
      vehicle: vehicle._id,
      status: "draft",
      services: [{ description: "Brake service", quantity: 1, price: 200 }],
      labor: 75,
      taxRate: 10,
    })
    .expect(201);
  estimate = created.body;
  assert.equal(estimate.total, 302.5);

  const updated = await request(app)
    .put(`/api/estimates/${estimate._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "approved" })
    .expect(200);
  assert.equal(updated.body.status, "approved");

  const pdf = await request(app)
    .get(`/api/estimates/${estimate._id}/pdf`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", "application/pdf");
  assert.ok(pdf.body.length > 1000);

  const converted = await request(app)
    .post(`/api/estimates/${estimate._id}/convert`)
    .set("Authorization", `Bearer ${token}`)
    .expect(201);
  assert.equal(converted.body.sourceEstimate, estimate._id);
});

test("legacy estimate without services can be converted", async () => {
  const Estimate = (await import("../src/models/Estimate.js")).default;
  const legacyId = new Estimate()._id;
  await Estimate.collection.insertOne({
    _id: legacyId,
    estimateNumber: "EST-LEGACY",
    customer: customer._id,
    vehicle: vehicle._id,
    status: "approved",
    labor: 125,
    taxRate: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const converted = await request(app)
    .post(`/api/estimates/${legacyId}/convert`)
    .set("Authorization", `Bearer ${token}`)
    .expect(201);

  assert.deepEqual(converted.body.services, []);
  assert.equal(converted.body.subtotal, 125);
  assert.equal(converted.body.total, 125);
});

test("dashboard reflects stored records", async () => {
  const response = await request(app)
    .get("/api/dashboard")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(response.body.customers, 1);
  assert.equal(response.body.vehicles, 1);
  assert.equal(response.body.revenue, 75);
  assert.equal(response.body.partsCost, 20);
  assert.equal(response.body.grossProfit, 55);
  assert.equal(response.body.currentMonth.grossProfit, 55);
  assert.equal(response.body.monthly[0].revenue, 75);
  assert.equal(response.body.sales.month.revenue, 75);
  assert.ok(response.body.appointmentStatus);
  assert.ok(response.body.customerSegments);
});

test("inventory tracks stock, margins and parts used by an order", async () => {
  const created = await request(app)
    .post("/api/inventory")
    .set("Authorization", `Bearer ${token}`)
    .send({ sku: "PAD-001", name: "Front brake pads", supplier: "Test Parts", quantity: 4, minimumStock: 2, cost: 35, salePrice: 75 })
    .expect(201);
  assert.equal(created.body.unitProfit, 40);
  inventoryPart = created.body;

  const used = await request(app)
    .post(`/api/inventory/${created.body._id}/use`)
    .set("Authorization", `Bearer ${token}`)
    .send({ workOrder: order._id, quantity: 1 })
    .expect(200);
  assert.equal(used.body.part.quantity, 3);
  assert.equal(used.body.order.partsUsed[0].name, "Front brake pads");

  const list = await request(app)
    .get("/api/inventory?page=1&limit=10")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(list.body.items.length, 1);
  assert.equal(list.body.pagination.total, 1);
  assert.equal(list.body.summary.units, 3);
});

test("customer interactions and reminder queue are persistent", async () => {
  const interaction = await request(app)
    .post(`/api/customers/${customer._id}/interactions`)
    .set("Authorization", `Bearer ${token}`)
    .send({ type: "whatsapp", direction: "outbound", note: "Sent maintenance follow-up" })
    .expect(201);
  assert.equal(interaction.body.type, "whatsapp");

  await request(app)
    .post("/api/reminders")
    .set("Authorization", `Bearer ${token}`)
    .send({ type: "custom", customer: customer._id, title: "Call customer", message: "Check repair satisfaction", dueAt: new Date() })
    .expect(201);
  const reminders = await request(app)
    .get("/api/reminders")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.ok(reminders.body.items.some((item) => item.title === "Call customer"));

  const detail = await request(app)
    .get(`/api/customers/${customer._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(detail.body.interactions[0].note, "Sent maintenance follow-up");
  assert.equal(detail.body.insights.visits, 1);
  assert.equal(detail.body.insights.totalSpent, 82.5);
});

test("security center exposes users, audit and safe backups", async () => {
  const users = await request(app).get("/api/security/users").set("Authorization", `Bearer ${token}`).expect(200);
  assert.equal(users.body.length, 1);
  assert.equal(users.body[0].password, undefined);

  const audit = await request(app).get("/api/security/audit").set("Authorization", `Bearer ${token}`).expect(200);
  assert.ok(audit.body.items.length > 0);

  const backup = await request(app).get("/api/security/backup").set("Authorization", `Bearer ${token}`).expect(200);
  assert.equal(backup.body.business, "Yeros Auto Services LLC");
  assert.equal(backup.body.data.customers.length, 1);
  assert.equal(backup.body.data.users, undefined);
});

test("digital inspections support photos, public review and signature decisions", async () => {
  const created = await request(app)
    .post("/api/inspections")
    .set("Authorization", `Bearer ${token}`)
    .send({ customer: customer._id, vehicle: vehicle._id, mileage: 26200 })
    .expect(201);
  assert.equal(created.body.items.length, 12);
  assert.equal(created.body.inspectionNumber, "INS-00001");

  const updated = await request(app)
    .put(`/api/inspections/${created.body._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ items: created.body.items.map((item, index) => ({ ...item, condition: index === 0 ? "urgent" : "good", notes: index === 0 ? "Pads need replacement" : "" })), summary: "Brake service recommended" })
    .expect(200);
  assert.equal(updated.body.items[0].condition, "urgent");

  const sent = await request(app)
    .post(`/api/inspections/${created.body._id}/send`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  const publicView = await request(app).get(`/api/public/inspections/${sent.body.inspection.publicToken}`).expect(200);
  assert.equal(publicView.body.summary, "Brake service recommended");
  const decision = await request(app)
    .post(`/api/public/inspections/${sent.body.inspection.publicToken}/decision`)
    .send({ decision: "approved", signature: "Test Customer" })
    .expect(200);
  assert.equal(decision.body.status, "approved");
});

test("finance records operating expenses, payments and net profit", async () => {
  await request(app)
    .post("/api/finance/expenses")
    .set("Authorization", `Bearer ${token}`)
    .send({ category: "fuel", description: "Service call fuel", amount: 20, date: new Date() })
    .expect(201);
  await request(app)
    .post("/api/finance/payments")
    .set("Authorization", `Bearer ${token}`)
    .send({ customer: customer._id, workOrder: order._id, type: "invoice", amount: 82.5, method: "zelle", status: "paid" })
    .expect(201);
  const finance = await request(app).get("/api/finance").set("Authorization", `Bearer ${token}`).expect(200);
  assert.equal(finance.body.summary.operatingExpenses, 20);
  assert.equal(finance.body.summary.collected, 82.5);
  assert.equal(finance.body.summary.netProfit, 35);
});

test("customer portal issues access, shows records and accepts login", async () => {
  const access = await request(app)
    .post(`/api/customers/${customer._id}/portal-access`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.match(access.body.code, /^\d{6}$/);
  const portalLogin = await request(app)
    .post("/api/portal/login")
    .send({ phone: customer.phone, code: access.body.code })
    .expect(200);
  const account = await request(app)
    .get("/api/portal/account")
    .set("Authorization", `Bearer ${portalLogin.body.token}`)
    .expect(200);
  assert.equal(account.body.customer.name, "Updated Customer");
  assert.equal(account.body.vehicles.length, 1);
  assert.ok(account.body.inspections.length > 0);
});

test("workshop, purchasing, reports and marketing suite share live business data", async () => {
  await request(app).put(`/api/workshop/${order._id}/stage`).set("Authorization", `Bearer ${token}`).send({ stage: "waiting_parts" }).expect(200);
  const board = await request(app).get("/api/workshop").set("Authorization", `Bearer ${token}`).expect(200);
  assert.ok(board.body.columns.waiting_parts.some((item) => item._id === order._id));

  const purchase = await request(app).post("/api/purchases").set("Authorization", `Bearer ${token}`).send({ supplier: "Test Parts", status: "ordered", items: [{ part: inventoryPart._id, quantity: 2, cost: 30 }] }).expect(201);
  assert.equal(purchase.body.total, 60);
  const received = await request(app).post(`/api/purchases/${purchase.body._id}/receive`).set("Authorization", `Bearer ${token}`).send({}).expect(200);
  assert.equal(received.body.status, "received");

  const report = await request(app).get("/api/reports/summary").set("Authorization", `Bearer ${token}`).expect(200);
  assert.ok(report.body.completedOrders >= 1);
  await request(app).get("/api/reports/transactions.csv").set("Authorization", `Bearer ${token}`).expect("Content-Type", /text\/csv/).expect(200);

  const offer = await request(app).post("/api/marketing/offers").set("Authorization", `Bearer ${token}`).send({ code: "BRAKES10", title: "Brake service", discountValue: 10 }).expect(201);
  assert.equal(offer.body.code, "BRAKES10");
  const marketing = await request(app).get("/api/marketing").set("Authorization", `Bearer ${token}`).expect(200);
  assert.equal(marketing.body.summary.activeOffers, 1);
});

test("mechanic assignments, timers and compensation work", async () => {
  const users = await request(app).get("/api/security/users").set("Authorization", `Bearer ${token}`).expect(200);
  const technicianId = users.body[0]._id;
  await request(app)
    .put(`/api/technicians/users/${technicianId}/compensation`)
    .set("Authorization", `Bearer ${token}`)
    .send({ hourlyRate: 30, commissionRate: 10 })
    .expect(200);
  await request(app)
    .post("/api/technicians/assign")
    .set("Authorization", `Bearer ${token}`)
    .send({ technician: technicianId, workOrder: order._id })
    .expect(200);
  const timer = await request(app)
    .post("/api/technicians/clock-in")
    .set("Authorization", `Bearer ${token}`)
    .send({ technician: technicianId, workOrder: order._id })
    .expect(201);
  const stopped = await request(app)
    .post(`/api/technicians/clock-out/${timer.body._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.ok(stopped.body.minutes >= 1);
});

test("two-factor authentication can be configured and verified", async () => {
  const setup = await request(app).post("/api/security/2fa/setup").set("Authorization", `Bearer ${token}`).expect(200);
  const { totpCode } = await import("../src/services/totp.js");
  const code = totpCode(setup.body.secret);
  await request(app).post("/api/security/2fa/enable").set("Authorization", `Bearer ${token}`).send({ code }).expect(200);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@yerosautoservices.com", password: "Admin123!", otp: totpCode(setup.body.secret) })
    .expect(200);
  assert.ok(login.body.token);
});

test("records can be deleted in dependency order", async () => {
  const Estimate = (await import("../src/models/Estimate.js")).default;
  await Estimate.deleteMany({});
  const ScannerReport = (await import("../src/models/ScannerReport.js")).default;
  await ScannerReport.deleteMany({});
  const WorkOrder = (await import("../src/models/WorkOrder.js")).default;
  await WorkOrder.deleteMany({});
  await request(app).delete(`/api/vehicles/${vehicle._id}`).set("Authorization", `Bearer ${token}`).expect(204);
  await request(app).delete(`/api/customers/${customer._id}`).set("Authorization", `Bearer ${token}`).expect(204);
});
