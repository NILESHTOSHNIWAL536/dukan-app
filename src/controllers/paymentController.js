const Payment = require("../models/Payment");
const Order = require("../models/Order");

async function create(req, res) {
  const { order, amount, method, note } = req.body;
  const value = Number(amount);
  if (!order || !Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ message: "Order and a positive payment amount are required" });
  }

  const target = await Order.findOne({ _id: order, owner: req.user.id });
  if (!target) return res.status(404).json({ message: "Order not found" });

  const total = Number(target.totals?.grandTotal || 0);
  const remaining = Math.max(total - Number(target.paidAmount || 0), 0);
  if (value > remaining) return res.status(400).json({ message: "Payment exceeds the outstanding amount" });

  const payment = await Payment.create({
    owner: req.user.id, order, amount: value, method: method || "", note: note || ""
  });

  target.paidAmount += value;
  target.status = target.paidAmount >= total ? "Paid" : target.paidAmount > 0 ? "Partial" : "Unpaid";
  await target.save();

  res.status(201).json({ payment, order: target });
}

async function list(req, res) {
  res.json(await Payment.find({ owner: req.user.id }).populate("order").sort({ createdAt: -1 }));
}

module.exports = { create, list };
