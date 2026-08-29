const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    salaryMin: {
      type: Number,
      required: true,
      min: 0,
    },

    salaryMax: {
      type: Number,
      required: true,
      min: 0,
    },

    leavesPerMonth: {
      type: Number,
      default: null,
      min: 0,
    },

    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Employee", employeeSchema);