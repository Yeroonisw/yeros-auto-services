import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    year: { type: Number, required: true, min: 1900, max: 2100 },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    vin: { type: String, trim: true, uppercase: true },
    plate: { type: String, trim: true, uppercase: true },
    color: { type: String, trim: true },
    mileage: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Vehicle", vehicleSchema);
