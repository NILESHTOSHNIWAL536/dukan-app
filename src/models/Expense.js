const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
    driverName: { type: String, required: true, trim: true },
    driverMobile: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ["Paid", "Partial", "Unpaid"], default: "Unpaid" },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("Expense", schema);
