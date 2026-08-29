const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    mobileNumber: { type: String, trim: true, required: true },
    primary: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    officeName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    contacts: {
      type: [contactSchema],
      validate: [(v) => v.length >= 1, "At least one contact is required"],
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    address: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, required: true },
    district: { type: String, trim: true, required: true },
    pincode: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
    officeLogo: { type: String, default: null },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
