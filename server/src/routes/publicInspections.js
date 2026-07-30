import express from "express";
import Inspection from "../models/Inspection.js";

const router = express.Router();

router.get("/:token", async (req, res, next) => {
  try {
    const inspection = await Inspection.findOne({ publicToken: req.params.token }).populate("customer", "name").populate("vehicle", "year make model vin plate");
    if (!inspection) return res.status(404).json({ message: "Inspection not found" });
    res.json(inspection);
  } catch (error) { next(error); }
});

router.post("/:token/decision", async (req, res, next) => {
  try {
    const inspection = await Inspection.findOne({ publicToken: req.params.token });
    if (!inspection) return res.status(404).json({ message: "Inspection not found" });
    if (!["approved", "declined"].includes(req.body.decision)) return res.status(400).json({ message: "Choose approve or decline" });
    inspection.status = req.body.decision;
    inspection.customerSignature = String(req.body.signature || "").trim();
    inspection.customerDecisionAt = new Date();
    await inspection.save();
    res.json({ message: `Inspection ${req.body.decision}`, status: inspection.status });
  } catch (error) { next(error); }
});

export default router;
