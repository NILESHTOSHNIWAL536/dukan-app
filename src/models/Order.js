const mongoose = require("mongoose");

// ============================================================
// ITEM
// ============================================================

const itemSchema = new mongoose.Schema(
  {
    riceName: {
      type: String,
      required: true,
      trim: true,
    },

    bags: {
      type: Number,
      required: true,
      min: 0,
    },

    kgPerBag: {
      type: Number,
      required: true,
      min: 0,
    },

    // Total KG = Bags × KG per Bag
    kg: {
      type: Number,
      required: true,
      min: 0,
    },

    // Quintal = Total KG / 100
    quintal: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

// ============================================================
// TOTALS
// ============================================================

const totalsSchema = new mongoose.Schema(
  {
    kg: {
      type: Number,
      default: 0,
      min: 0,
    },

    quintal: {
      type: Number,
      default: 0,
      min: 0,
    },

    bags: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Original bill amount before discount
    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Existing bill discount
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 6,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Final bill amount after discount
    netTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

// ============================================================
// ORDER
// ============================================================

const schema = new mongoose.Schema(
  {
    // ========================================================
    // BASIC
    // ========================================================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Existing order number
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // Printed "No." on document
    documentNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // ========================================================
    // CLIENT / RICE MILL
    // ========================================================

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    riceMill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RiceMill",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    riceMillName: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================================
    // DATE
    // ========================================================

    date: {
      type: Date,
      required: true,
    },

    displayDate: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================================
    // DISPATCH / RICE
    // ========================================================

    // Example: 1010 Boiled
    dispatchRiceName: {
      type: String,
      trim: true,
      default: "",
    },

    // ========================================================
    // TRANSPORT
    // ========================================================

    lorryNumber: {
      type: String,
      trim: true,
      default: "",
    },

    transportName: {
      type: String,
      trim: true,
      default: "",
    },

    driverName: {
      type: String,
      trim: true,
      default: "",
    },

    driverMobile: {
      type: String,
      trim: true,
      default: "",
    },
    
    brand: {
      type: String,
      trim: true,
      default: "",
    },

    // ========================================================
    // LOADING / DELIVERY
    // ========================================================

    loadingRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // LORRY PAYMENT
    // ========================================================

    // Please Pay Lorry Freight
    lorryFreight: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Less: Lorry Advance Paid
    lorryAdvancePaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Balance to Pay = Freight - Advance
    balanceToPay: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // RICE ITEMS
    // ========================================================

    items: {
      type: [itemSchema],

      validate: [
        (value) => value.length > 0,
        "At least one rice item is required",
      ],
    },

    // ========================================================
    // TOTALS
    // ========================================================

    totals: {
      type: totalsSchema,
      default: () => ({}),
    },

    // ========================================================
    // BILL DISCOUNT
    // ========================================================

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 6,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    netTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // RTGS / CASH DISCOUNT
    // ========================================================

    // Example: 4%
    rtgsPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Example: 2%
    cashDiscountPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Example: 5 days
    cashDiscountDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // BANK
    // ========================================================

    bankName: {
      type: String,
      trim: true,
      default: "",
    },

    branchName: {
      type: String,
      trim: true,
      default: "",
    },

    // ========================================================
    // BILL DETAILS
    // ========================================================

    billNumber: {
      type: String,
      trim: true,
      default: "",
    },

    billAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // PAYMENT
    // ========================================================

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Paid", "Partial", "Unpaid"],
      default: "Unpaid",
    },

    // ========================================================
    // THROUGH / NOTES
    // ========================================================

    through: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },

  {
    timestamps: true,
    versionKey: false,
  },
);

// ============================================================
// INDEXES
// ============================================================

schema.index(
  {
    owner: 1,
    orderNumber: 1,
  },
  {
    unique: true,
  },
);

schema.index({
  owner: 1,
  date: -1,
});

module.exports = mongoose.model("Order", schema);