const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    riceName: { type: String, required: true, trim: true },
    bags: { type: Number, required: true, min: 0 },
    kgPerBag: { type: Number, required: true, min: 0 },
    kg: { type: Number, required: true, min: 0 },
    quintal: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const totalsSchema = new mongoose.Schema(
  {
    kg: { type: Number, default: 0, min: 0 },
    quintal: { type: Number, default: 0, min: 0 },
    bags: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderNumber: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    riceMill: { type: mongoose.Schema.Types.ObjectId, ref: "RiceMill", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
    clientName: { type: String, required: true, trim: true },
    riceMillName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    displayDate: { type: String, required: true, trim: true },
    lorryNumber: { type: String, trim: true, default: "" },
    transportName: { type: String, trim: true, default: "" },
    driverName: { type: String, trim: true, default: "" },
    driverMobile: { type: String, trim: true, default: "" },
    items: {
      type: [itemSchema],
      validate: [(value) => value.length > 0, "At least one rice item is required"],
    },
    totals: { type: totalsSchema, default: () => ({}) },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["Paid", "Partial", "Unpaid"], default: "Unpaid" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ owner: 1, orderNumber: 1 }, { unique: true });
schema.index({ owner: 1, date: -1 });

module.exports = mongoose.model("Order", schema);
