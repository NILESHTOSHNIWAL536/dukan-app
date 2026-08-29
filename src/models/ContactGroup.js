const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "Unknown Contact" },
    mobile: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    groupName: { type: String, required: true, trim: true },
    contacts: {
      type: [contactSchema],
      validate: [(value) => value.length > 0, "At least one contact is required"],
    },
    contactId: { type: String, trim: true, default: "" },
    contactName: { type: String, trim: true, default: "" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ owner: 1, groupName: 1 });

module.exports = mongoose.model("ContactGroup", schema);
