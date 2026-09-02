const mongoose = require("mongoose");
const Order = require("../models/Order");
const Client = require("../models/Client");
const RiceMill = require("../models/RiceMill");
const Driver = require("../models/Driver");
const { cleanPhone, cleanString, parseIndianDate, formatIndianDate } = require("../utils/normalize");

function normalizeStatus(paidAmount, grandTotal) {
  const paid = Math.min(Math.max(Number(paidAmount) || 0, 0), grandTotal);
  if (paid >= grandTotal && grandTotal > 0) return "Paid";
  if (paid > 0) return "Partial";
  return "Unpaid";
}

function normalizeItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const bags = Number(item.bags || 0);
      const kgPerBag = Number(item.kgPerBag ?? item.kgPerBagValue ?? 0);
      const kg = Number(item.kg || bags * kgPerBag);
      const quintal = Number(item.quintal || kg / 100);
      const rate = Number(item.rate || 0);
      const amount = Number(item.amount || kg * rate);
      return {
        riceName: cleanString(item.riceName),
        bags,
        kgPerBag,
        kg,
        quintal,
        rate,
        amount,
      };
    })
    .filter((item) => item.riceName && item.bags > 0 && item.kg > 0 && item.rate >= 0);
}

function calculateTotals(items) {
  return items.reduce(
    (total, item) => {
      total.bags += item.bags;
      total.kg += item.kg;
      total.quintal += item.quintal;
      total.grandTotal += item.amount;
      return total;
    },
    { kg: 0, quintal: 0, bags: 0, grandTotal: 0 }
  );
}

async function ensureDriver(owner, name, phone, lorryNumber) {
  const driverName = cleanString(name);
  const driverMobile = cleanPhone(phone);
  if (!driverName || driverMobile.length !== 10) return null;

  return Driver.findOneAndUpdate(
    { owner, phone: driverMobile },
    { owner, name: driverName, phone: driverMobile, vehicleNumber: cleanString(lorryNumber).toUpperCase() },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function list(req, res) {
  const filter = { owner: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.from || req.query.to) filter.date = {};
  if (req.query.from) filter.date.$gte = parseIndianDate(req.query.from);
  if (req.query.to) {
    const to = parseIndianDate(req.query.to);
    to.setHours(23, 59, 59, 999);
    filter.date.$lte = to;
  }

  res.json(await Order.find(filter).populate("client riceMill driver").sort({ date: -1, createdAt: -1 }));
}

async function create(req, res) {
  try {
    

    // ========================================================
    // CLIENT / RICE MILL
    // ========================================================

    const clientId = req.body.client || req.body.clientId;
    const riceMillId = req.body.riceMill || req.body.riceMillId;

    if (
      !mongoose.isValidObjectId(clientId) ||
      !mongoose.isValidObjectId(riceMillId)
    ) {
      return res.status(400).json({
        message: "Client and rice mill are required",
      });
    }

    const owner = req.user.id;

    const [client, riceMill] = await Promise.all([
      Client.findOne({
        _id: clientId,
        owner,
      }),

      RiceMill.findOne({
        _id: riceMillId,
        owner,
      }),
    ]);

    if (!client) {
      return res.status(400).json({
        message: "Invalid client",
      });
    }

    if (!riceMill) {
      return res.status(400).json({
        message: "Invalid rice mill",
      });
    }

    // ========================================================
    // ITEMS
    // ========================================================

    const items = normalizeItems(req.body.items);

    if (!items.length) {
      return res.status(400).json({
        message: "At least one valid rice item is required",
      });
    }

    // ========================================================
    // CALCULATE BILL TOTAL
    // ========================================================

    const calculatedTotals = calculateTotals(items);

    const grandTotal = Number(
      calculatedTotals.grandTotal || 0
    );

    // ========================================================
    // BILL DISCOUNT
    // ========================================================

    let discountPercentage = Number(
      req.body.discountPercentage ?? 0
    );

    if (!Number.isFinite(discountPercentage)) {
      discountPercentage = 0;
    }

    discountPercentage = Math.min(
      Math.max(discountPercentage, 0),
      6
    );

    discountPercentage = Math.round(
      discountPercentage
    );

    // ========================================================
    // DISCOUNT AMOUNT
    // ========================================================

    const discountAmount =
      grandTotal *
      (discountPercentage / 100);

    // ========================================================
    // NET BILL TOTAL
    // ========================================================

    const netTotal = Math.max(
      grandTotal - discountAmount,
      0
    );

    // ========================================================
    // TOTALS
    // ========================================================

    const totals = {
      bags: Number(
        calculatedTotals.totalBags || 0
      ),

      kg: Number(
        calculatedTotals.totalKg || 0
      ),

      quintal: Number(
        calculatedTotals.totalQuintal || 0
      ),

      grandTotal,

      discountPercentage,

      discountAmount,

      netTotal,
    };

    // ========================================================
    // LORRY PAYMENT
    // ========================================================

    const lorryFreight = Math.max(
      Number(req.body.lorryFreight) || 0,
      0
    );

    const lorryAdvancePaid = Math.min(
      Math.max(
        Number(req.body.lorryAdvancePaid) || 0,
        0
      ),
      lorryFreight
    );

    const balanceToPay = Math.max(
      lorryFreight - lorryAdvancePaid,
      0
    );

    // ========================================================
    // PAID AMOUNT
    // ========================================================

    const paidAmount = Math.min(
      Math.max(
        Number(req.body.paidAmount) || 0,
        0
      ),
      netTotal
    );

    // ========================================================
    // DATE
    // ========================================================

    const orderDate = parseIndianDate(
      req.body.date ||
      req.body.displayDate
    );

    // ========================================================
    // DRIVER
    // ========================================================

    const driver = await ensureDriver(
      owner,
      req.body.driverName,
      req.body.driverMobile,
      req.body.lorryNumber
    );

    // ========================================================
    // ORDER NUMBER
    // ========================================================

    const count = await Order.countDocuments({
      owner,
    });

    const orderNumber =
      req.body.orderNumber ||
      `ORD${String(count + 1).padStart(4, "0")}`;

    // ========================================================
    // DOCUMENT NUMBER
    // ========================================================

    const documentNumber = cleanString(
      req.body.documentNumber ||
      req.body.orderNumber ||
      String(count + 1)
    );

    // ========================================================
    // NEW PRINT DOCUMENT FIELDS
    // ========================================================

    const dispatchRiceName = cleanString(
      req.body.dispatchRiceName
    );

    const loadingRate = Math.max(
      Number(req.body.loadingRate) || 0,
      0
    );

    const deliveryRate = Math.max(
      Number(req.body.deliveryRate) || 0,
      0
    );

    const rtgsPercentage = Math.max(
      Number(req.body.rtgsPercentage) || 0,
      0
    );

    const cashDiscountPercentage = Math.max(
      Number(
        req.body.cashDiscountPercentage
      ) || 0,
      0
    );

    const cashDiscountDays = Math.max(
      Number(req.body.cashDiscountDays) || 0,
      0
    );

    const bankName = cleanString(
      req.body.bankName
    );

    const branchName = cleanString(
      req.body.branchName
    );

    const billNumber = cleanString(
      req.body.billNumber
    );

    const billAmount = Math.max(
      Number(req.body.billAmount) || 0,
      0
    );

    const through = cleanString(
      req.body.through
    );

    // ========================================================
    // CREATE ORDER
    // ========================================================

    const order = await Order.create({
      owner,

      // Basic
      orderNumber,
      documentNumber,

      // References
      client: client._id,
      riceMill: riceMill._id,
      driver: driver?._id || null,

      // Names
      clientName: client.name,
      riceMillName: riceMill.name,

      // Date
      date: orderDate,
      displayDate: formatIndianDate(orderDate),

      // ======================================================
      // PRINT DOCUMENT
      // ======================================================

      dispatchRiceName,

      // ======================================================
      // TRANSPORT
      // ======================================================

      lorryNumber: cleanString(
        req.body.lorryNumber
      ).toUpperCase(),
      
      brand: cleanString(
        req.body.brand
      ).toUpperCase(),

      transportName: cleanString(
        req.body.transportName
      ),

      driverName: cleanString(
        req.body.driverName
      ),

      driverMobile: cleanPhone(
        req.body.driverMobile
      ),

      // ======================================================
      // LOADING / DELIVERY
      // ======================================================

      loadingRate,
      deliveryRate,

      // ======================================================
      // LORRY PAYMENT
      // ======================================================

      lorryFreight,
      lorryAdvancePaid,
      balanceToPay,

      // ======================================================
      // ITEMS
      // ======================================================

      items,

      // ======================================================
      // TOTALS
      // ======================================================

      totals,

      // ======================================================
      // BILL DISCOUNT
      // ======================================================

      discountPercentage,
      discountAmount,
      netTotal,

      // ======================================================
      // RTGS / CASH DISCOUNT
      // ======================================================

      rtgsPercentage,
      cashDiscountPercentage,
      cashDiscountDays,

      // ======================================================
      // BANK
      // ======================================================

      bankName,
      branchName,

      // ======================================================
      // BILL
      // ======================================================

      billNumber,
      billAmount,

      // ======================================================
      // PAYMENT
      // ======================================================

      paidAmount,

      status: normalizeStatus(
        paidAmount,
        netTotal
      ),

      // ======================================================
      // OTHER
      // ======================================================

      through,

      notes: cleanString(
        req.body.notes
      ),
    });

    // ========================================================
    // POPULATE
    // ========================================================

    const populatedOrder =
      await order.populate(
        "client riceMill driver"
      );

    return res.status(201).json(
      populatedOrder
    );

  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "Unable to create order",
    });
  }
}


async function update(req, res) {
  try {
    // ============================================================
    // FIND ORDER
    // ============================================================

    const order = await Order.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // ============================================================
    // CLIENT
    // ============================================================

    if (req.body.client || req.body.clientId) {
      const clientId =
        req.body.client || req.body.clientId;

      const client = await Client.findOne({
        _id: clientId,
        owner: req.user.id,
      });

      if (!client) {
        return res.status(400).json({
          message: "Invalid client",
        });
      }

      order.client = client._id;
      order.clientName = client.name;
    }

    // ============================================================
    // RICE MILL
    // ============================================================

    if (req.body.riceMill || req.body.riceMillId) {
      const riceMillId =
        req.body.riceMill || req.body.riceMillId;

      const riceMill = await RiceMill.findOne({
        _id: riceMillId,
        owner: req.user.id,
      });

      if (!riceMill) {
        return res.status(400).json({
          message: "Invalid rice mill",
        });
      }

      order.riceMill = riceMill._id;
      order.riceMillName = riceMill.name;
    }

    // ============================================================
    // ITEMS
    // ============================================================

    if (req.body.items !== undefined) {
      const items = normalizeItems(req.body.items);

      if (!items.length) {
        return res.status(400).json({
          message:
            "At least one valid rice item is required",
        });
      }

      order.items = items;
    }

    // ============================================================
    // DATE
    // ============================================================

    if (
      req.body.date !== undefined ||
      req.body.displayDate !== undefined
    ) {
      order.date = parseIndianDate(
        req.body.date ||
        req.body.displayDate
      );

      order.displayDate =
        formatIndianDate(order.date);
    }

    // ============================================================
    // BASIC FIELDS
    // ============================================================

    const writable = [
      "lorryNumber",
      "transportName",
      "driverName",
      "notes",
    ];

    for (const field of writable) {
      if (req.body[field] !== undefined) {
        order[field] = cleanString(
          req.body[field]
        );
      }
    }

    if (req.body.driverMobile !== undefined) {
      order.driverMobile = cleanPhone(
        req.body.driverMobile
      );
    }

    // ============================================================
    // RECALCULATE ORIGINAL TOTAL
    // ============================================================

    const calculatedTotals =
      calculateTotals(order.items || []);

    const grandTotal = Number(
      calculatedTotals.grandTotal || 0
    );

    // ============================================================
    // QUANTITY TOTALS
    // Supports both possible property names
    // ============================================================

    const totalBags = Number(
      calculatedTotals.totalBags ??
      calculatedTotals.bags ??
      (order.items || []).reduce(
        (sum, item) =>
          sum + Number(item.bags || 0),
        0
      )
    );

    const totalKg = Number(
      calculatedTotals.totalKg ??
      calculatedTotals.kg ??
      (order.items || []).reduce(
        (sum, item) =>
          sum + Number(item.kg || 0),
        0
      )
    );

    const totalQuintal = Number(
      calculatedTotals.totalQuintal ??
      calculatedTotals.quintal ??
      (order.items || []).reduce(
        (sum, item) =>
          sum + Number(item.quintal || 0),
        0
      )
    );

    // ============================================================
    // DISCOUNT PERCENTAGE
    //
    // If frontend sends discountPercentage,
    // use the new value.
    //
    // Otherwise preserve existing discount.
    // Old orders automatically become 0%.
    // ============================================================

    let discountPercentage;

    if (
      req.body.discountPercentage !== undefined &&
      req.body.discountPercentage !== null
    ) {
      discountPercentage = Number(
        req.body.discountPercentage
      );
    } else {
      discountPercentage = Number(
        order.discountPercentage ??
        order.totals?.discountPercentage ??
        0
      );
    }

    // Invalid value = 0
    if (!Number.isFinite(discountPercentage)) {
      discountPercentage = 0;
    }

    // Whole percentage only
    discountPercentage =
      Math.round(discountPercentage);

    // Allowed range = 0% to 6%
    discountPercentage = Math.min(
      Math.max(discountPercentage, 0),
      6
    );

    // ============================================================
    // DISCOUNT AMOUNT
    //
    // ALWAYS calculate on backend.
    // Don't trust frontend discountAmount.
    // ============================================================

    const discountAmount =
      grandTotal *
      (discountPercentage / 100);

    // ============================================================
    // NET TOTAL
    // ============================================================

    const netTotal = Math.max(
      grandTotal - discountAmount,
      0
    );

    // ============================================================
    // UPDATE TOTALS
    // ============================================================

    order.totals = {
      bags: totalBags,
      kg: totalKg,
      quintal: totalQuintal,

      // Original amount
      grandTotal,

      // Discount
      discountPercentage,
      discountAmount,

      // Final payable amount
      netTotal,
    };

    // ============================================================
    // TOP LEVEL DISCOUNT VALUES
    // ============================================================

    order.discountPercentage =
      discountPercentage;

    order.discountAmount =
      discountAmount;

    order.netTotal =
      netTotal;

    // ============================================================
    // PAID AMOUNT
    //
    // Payment can NEVER be greater than NET TOTAL.
    // ============================================================

    const requestedPaidAmount =
      req.body.paidAmount !== undefined
        ? Number(req.body.paidAmount)
        : Number(order.paidAmount || 0);

    const paidAmount = Math.min(
      Math.max(
        Number.isFinite(requestedPaidAmount)
          ? requestedPaidAmount
          : 0,
        0
      ),
      netTotal
    );

    order.paidAmount = paidAmount;

    // ============================================================
    // PAYMENT STATUS
    //
    // Use NET TOTAL, not GRAND TOTAL.
    // ============================================================

    order.status = normalizeStatus(
      paidAmount,
      netTotal
    );

    // ============================================================
    // DRIVER
    // ============================================================

    const driver = await ensureDriver(
      req.user.id,
      order.driverName,
      order.driverMobile,
      order.lorryNumber
    );

    order.driver =
      driver?._id || null;

    // ============================================================
    // SAVE
    // ============================================================

    await order.save();

    // ============================================================
    // RESPONSE
    // ============================================================

    const populatedOrder =
      await order.populate(
        "client riceMill driver"
      );

    return res.json(
      populatedOrder
    );
  } catch (error) {
    console.error(
      "UPDATE ORDER ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error?.message ||
        "Unable to update order",
    });
  }
}

async function remove(req, res) {
  const deleted = await Order.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Order not found" });
  res.status(204).end();
}

module.exports = { list, create, update, remove };
