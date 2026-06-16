import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

let mongo;
let app;
let token;
let customer;
let vehicle;
let order;
let estimate;

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
    .send({ customer: customer._id, year: 2022, make: "Toyota", model: "Camry", mileage: 25000 })
    .expect(201);
  vehicle = created.body;
  assert.equal(vehicle.customer._id, customer._id);

  const updated = await request(app)
    .put(`/api/vehicles/${vehicle._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ mileage: 25100 })
    .expect(200);
  assert.equal(updated.body.mileage, 25100);
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
      labor: 25,
      taxRate: 10,
    })
    .expect(201);
  order = created.body;
  assert.equal(order.total, 82.5);
  assert.equal(order.partsCost, 20);
  assert.equal(order.grossProfit, 55);
  assert.equal(order.dtcCodes[0].code, "P0300");

  const updated = await request(app)
    .put(`/api/work-orders/${order._id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "completed" })
    .expect(200);
  assert.equal(updated.body.status, "completed");
  assert.ok(updated.body.completedAt);
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

test("work order detail and deep search work", async () => {
  const detail = await request(app)
    .get(`/api/work-orders/${order._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(detail.body.customer.name, "Updated Customer");
  assert.equal(detail.body.vehicle.vin || "", "");
  assert.equal(detail.body.dtcCodes[0].code, "P0300");

  const byDtc = await request(app)
    .get("/api/search?q=P0300")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(byDtc.body.workOrders.length, 1);

  const byCustomer = await request(app)
    .get("/api/search?q=Updated")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(byCustomer.body.customers.length, 1);
  assert.equal(byCustomer.body.vehicles.length, 1);
  assert.equal(byCustomer.body.workOrders.length, 1);
});
test("invoice PDF is generated", async () => {
  const response = await request(app)
    .get(`/api/work-orders/${order._id}/invoice`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", "application/pdf");
  assert.ok(response.body.length > 1000);
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
});

test("records can be deleted in dependency order", async () => {
  const Estimate = (await import("../src/models/Estimate.js")).default;
  await Estimate.deleteMany({});
  const WorkOrder = (await import("../src/models/WorkOrder.js")).default;
  await WorkOrder.deleteMany({});
  await request(app).delete(`/api/vehicles/${vehicle._id}`).set("Authorization", `Bearer ${token}`).expect(204);
  await request(app).delete(`/api/customers/${customer._id}`).set("Authorization", `Bearer ${token}`).expect(204);
});
