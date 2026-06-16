import express from "express";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import Estimate from "../models/Estimate.js";

const router = express.Router();

function escapedRegex(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

router.get("/", async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < 2) {
      return res.json({ query, customers: [], vehicles: [], workOrders: [], estimates: [] });
    }

    const regex = escapedRegex(query);
    const [matchingCustomers, directVehicles] = await Promise.all([
      Customer.find({ $or: [{ name: regex }, { phone: regex }, { email: regex }, { address: regex }, { notes: regex }] }),
      Vehicle.find({
        $or: [{ make: regex }, { model: regex }, { vin: regex }, { plate: regex }, { color: regex }],
      }).populate("customer", "name phone"),
    ]);

    const customerIds = matchingCustomers.map((customer) => customer._id);
    const customerVehicles = customerIds.length
      ? await Vehicle.find({ customer: { $in: customerIds } }).populate("customer", "name phone")
      : [];
    const vehicleMap = new Map([...directVehicles, ...customerVehicles].map((vehicle) => [vehicle.id, vehicle]));
    const vehicles = [...vehicleMap.values()];
    const vehicleIds = vehicles.map((vehicle) => vehicle._id);

    const relationFilter = [
      ...(customerIds.length ? [{ customer: { $in: customerIds } }] : []),
      ...(vehicleIds.length ? [{ vehicle: { $in: vehicleIds } }] : []),
    ];

    const [workOrders, estimates] = await Promise.all([
      WorkOrder.find({
        $or: [
          { orderNumber: regex },
          { notes: regex },
          { "services.description": regex },
          { "dtcCodes.code": regex },
          { "dtcCodes.description": regex },
          ...relationFilter,
        ],
      })
        .populate("customer", "name phone email")
        .populate("vehicle", "year make model plate vin")
        .sort({ createdAt: -1 })
        .limit(50),
      Estimate.find({
        $or: [
          { estimateNumber: regex },
          { notes: regex },
          { "services.description": regex },
          ...relationFilter,
        ],
      })
        .populate("customer", "name phone email")
        .populate("vehicle", "year make model plate vin")
        .sort({ createdAt: -1 })
        .limit(50),
    ]);

    res.json({
      query,
      customers: matchingCustomers.slice(0, 50),
      vehicles: vehicles.slice(0, 50),
      workOrders,
      estimates,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
