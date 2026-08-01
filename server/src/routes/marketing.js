import express from "express";
import Customer from "../models/Customer.js";
import WorkOrder from "../models/WorkOrder.js";
import Offer from "../models/Offer.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();
router.get("/", async (req, res, next) => {
  try {
    const cutoff = new Date(Date.now() - 90 * 86400000);
    const [offers, recentOrders, customers] = await Promise.all([Offer.find().sort({ createdAt: -1 }), WorkOrder.find({ status: "completed" }).populate("customer", "name phone email").sort({ completedAt: -1 }).limit(100), Customer.find({ active: { $ne: false } }).select("name phone email createdAt")]);
    const recentCustomerIds = new Set(recentOrders.filter((item) => item.completedAt >= cutoff).map((item) => String(item.customer?._id)));
    const dormant = customers.filter((item) => !recentCustomerIds.has(String(item._id))).slice(0, 50);
    res.json({ offers, dormant, reviewCandidates: recentOrders.slice(0, 25), summary: { activeOffers: offers.filter((item) => item.active).length, dormant: dormant.length, reviewCandidates: recentOrders.length, customers: customers.length } });
  } catch (error) { next(error); }
});
router.post("/offers", async (req, res, next) => {
  try { const offer = await Offer.create(req.body); await recordAudit(req, "create", "Offer", offer, `Created offer ${offer.code}`); res.status(201).json(offer); }
  catch (error) { next(error); }
});
router.put("/offers/:id", async (req, res, next) => {
  try { const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!offer) return res.status(404).json({ message: "Offer not found" }); res.json(offer); }
  catch (error) { next(error); }
});
router.post("/review-link", async (req, res) => {
  const customer = await Customer.findById(req.body.customer);
  if (!customer) return res.status(404).json({ message: "Customer not found" });
  const url = process.env.GOOGLE_REVIEW_URL || process.env.PUBLIC_URL || "https://www.yerosautoservicesllc.com";
  const message = `Hello ${customer.name}, thank you for choosing Yeros Auto Services. Would you share your experience? ${url}`;
  const phone = String(customer.phone || "").replace(/\D/g, "");
  res.json({ url, whatsappUrl: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "", configured: Boolean(process.env.GOOGLE_REVIEW_URL) });
});
export default router;
