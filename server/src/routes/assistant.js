import express from "express";
import OpenAI from "openai";

const router = express.Router();

router.get("/status", (req, res) => {
  res.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-5.5",
  });
});

router.post("/", async (req, res, next) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        message: "OpenAI is not configured. Add OPENAI_API_KEY to server/.env and restart the server.",
      });
    }

    const question = String(req.body.question || "").trim();
    if (!question) return res.status(400).json({ message: "Enter a question" });
    if (question.length > 5000) return res.status(400).json({ message: "Question is too long" });

    const vehicle = req.body.vehicle || {};
    const context = [
      vehicle.year && `Year: ${vehicle.year}`,
      vehicle.make && `Make: ${vehicle.make}`,
      vehicle.model && `Model: ${vehicle.model}`,
      vehicle.engine && `Engine: ${vehicle.engine}`,
      vehicle.mileage && `Mileage: ${vehicle.mileage}`,
      vehicle.dtcCodes && `DTC codes: ${vehicle.dtcCodes}`,
      vehicle.symptoms && `Symptoms: ${vehicle.symptoms}`,
    ].filter(Boolean).join("\n");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      reasoning: { effort: "low" },
      text: { verbosity: "medium" },
      instructions: [
        "You are an automotive diagnostic assistant for a professional repair shop.",
        "Answer in the same language as the technician.",
        "Give a concise diagnostic plan ordered from safest and most likely checks to more involved checks.",
        "Explain DTC codes when provided, but do not treat a code as proof that a component is defective.",
        "Include likely causes, tests, required tools, expected readings when reliable, and safety warnings.",
        "Clearly say when factory service information, wiring diagrams, torque specifications, or a qualified technician are required.",
        "Never invent exact specifications. Tell the technician to verify them in the service manual.",
      ].join(" "),
      input: context ? `Vehicle context:\n${context}\n\nTechnician question:\n${question}` : question,
      previous_response_id: req.body.previousResponseId || undefined,
    });

    res.json({ answer: response.output_text, responseId: response.id });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message || "OpenAI request failed" });
    }
    next(error);
  }
});

export default router;
