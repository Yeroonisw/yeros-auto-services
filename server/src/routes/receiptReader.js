import express from "express";
import { extractReceipt } from "../services/receiptReader.js";

const router = express.Router();

router.post("/preview", async (req, res, next) => {
  try {
    const receipt = await extractReceipt(req.body);
    if (!receipt.items.length) {
      return res.status(422).json({ message: "No receipt line items were found. Try a clearer image or a PDF receipt." });
    }
    res.json(receipt);
  } catch (error) {
    next(error);
  }
});

export default router;
