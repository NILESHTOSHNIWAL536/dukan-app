const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Payment", schema);
