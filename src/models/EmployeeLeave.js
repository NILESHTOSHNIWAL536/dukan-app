const mongoose = require("mongoose");

const employeeLeaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Leave", "Present"],
      default: "Leave",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "EmployeeLeave",
  employeeLeaveSchema
);