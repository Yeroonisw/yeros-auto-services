import express from "express";
import Appointment from "../models/Appointment.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();
const populate = [
  { path: "customer", select: "name phone email address" },
  { path: "vehicle", select: "year make model plate vin customer" },
];

async function validateRelations(body) {
  const customer = await Customer.findById(body.customer);
  if (!customer) return "Select a valid customer";
  if (!body.vehicle) return null;

  const vehicle = await Vehicle.findById(body.vehicle);
  if (!vehicle) return "Select a valid vehicle";
  if (String(vehicle.customer) !== String(customer._id)) return "The vehicle does not belong to this customer";
  return null;
}

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.scheduledAt = {};
      if (req.query.from) filter.scheduledAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.scheduledAt.$lte = new Date(req.query.to);
    }
    res.json(await Appointment.find(filter).populate(populate).sort({ scheduledAt: 1 }));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const relationError = await validateRelations(req.body);
    if (relationError) return res.status(400).json({ message: relationError });
    const appointment = await Appointment.create(req.body);
    res.status(201).json(await appointment.populate(populate));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const current = await Appointment.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Appointment not found" });
    const relationError = await validateRelations({
      customer: req.body.customer || current.customer,
      vehicle: req.body.vehicle === undefined ? current.vehicle : req.body.vehicle,
    });
    if (relationError) return res.status(400).json({ message: relationError });

    Object.assign(current, req.body);
    await current.save();
    res.json(await current.populate(populate));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
