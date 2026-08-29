const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    mobileNumber: { type: String, trim: true, required: true },
    primary: { type: Boolean, default: false },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true, default: "" },
    contacts: { type: [contactSchema], default: [] },
    phones: { type: [String], default: [] },
    phone: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, required: true },
    district: { type: String, trim: true, required: true },
    address: { type: String, trim: true, default: "" },
    gstNumber: { type: String, trim: true, uppercase: true, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ owner: 1, name: 1, state: 1, district: 1 });

module.exports = mongoose.model("RiceMill", schema);
