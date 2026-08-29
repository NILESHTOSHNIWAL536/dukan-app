const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, required: true },
    vehicleNumber: { type: String, trim: true, default: "" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ owner: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("Driver", schema);
