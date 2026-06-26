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
    oilChange: {
      lastDate: Date,
      lastMileage: { type: Number, min: 0, default: 0 },
      intervalMiles: { type: Number, min: 0, default: 3000 },
      intervalMonths: { type: Number, min: 0, default: 3 },
      notes: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

vehicleSchema.virtual("oilChangeStatus").get(function oilChangeStatus() {
  const oilChange = this.oilChange || {};
  const currentMileage = Number(this.mileage || 0);
  const lastMileage = Number(oilChange.lastMileage || 0);
  const intervalMiles = Number(oilChange.intervalMiles || 0);
  const nextMileage = lastMileage && intervalMiles ? lastMileage + intervalMiles : 0;
  const milesRemaining = nextMileage ? nextMileage - currentMileage : null;
  let nextDate = null;
  let daysRemaining = null;

  if (oilChange.lastDate && Number(oilChange.intervalMonths || 0)) {
    nextDate = new Date(oilChange.lastDate);
    nextDate.setMonth(nextDate.getMonth() + Number(oilChange.intervalMonths || 0));
    daysRemaining = Math.ceil((nextDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  }

  const dueByMileage = milesRemaining !== null && milesRemaining <= 0;
  const dueByDate = daysRemaining !== null && daysRemaining <= 0;
  const dueSoonByMileage = milesRemaining !== null && milesRemaining > 0 && milesRemaining <= 500;
  const dueSoonByDate = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 14;
  const status = dueByMileage || dueByDate ? "overdue" : dueSoonByMileage || dueSoonByDate ? "due_soon" : "current";

  return {
    status,
    nextMileage,
    milesRemaining,
    nextDate,
    daysRemaining,
    dueByMileage,
    dueByDate,
  };
});

export default mongoose.model("Vehicle", vehicleSchema);
