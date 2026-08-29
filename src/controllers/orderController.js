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
  const clientId = req.body.client || req.body.clientId;
  const riceMillId = req.body.riceMill || req.body.riceMillId;
  if (!mongoose.isValidObjectId(clientId) || !mongoose.isValidObjectId(riceMillId)) {
    return res.status(400).json({ message: "Client and rice mill are required" });
  }

  const owner = req.user.id;
  const [client, riceMill] = await Promise.all([
    Client.findOne({ _id: clientId, owner }),
    RiceMill.findOne({ _id: riceMillId, owner }),
  ]);
  if (!client) return res.status(400).json({ message: "Invalid client" });
  if (!riceMill) return res.status(400).json({ message: "Invalid rice mill" });

  const items = normalizeItems(req.body.items);
  if (!items.length) return res.status(400).json({ message: "At least one valid rice item is required" });

  const totals = calculateTotals(items);
  const paidAmount = Math.min(Math.max(Number(req.body.paidAmount) || 0, 0), totals.grandTotal);
  const orderDate = parseIndianDate(req.body.date || req.body.displayDate);
  const driver = await ensureDriver(owner, req.body.driverName, req.body.driverMobile, req.body.lorryNumber);

  const count = await Order.countDocuments({ owner });
  const order = await Order.create({
    owner,
    orderNumber: req.body.orderNumber || `ORD${String(count + 1).padStart(4, "0")}`,
    client: client._id,
    riceMill: riceMill._id,
    driver: driver?._id || null,
    clientName: client.name,
    riceMillName: riceMill.name,
    date: orderDate,
    displayDate: formatIndianDate(orderDate),
    lorryNumber: cleanString(req.body.lorryNumber).toUpperCase(),
    transportName: cleanString(req.body.transportName),
    driverName: cleanString(req.body.driverName),
    driverMobile: cleanPhone(req.body.driverMobile),
    items,
    totals,
    paidAmount,
    status: normalizeStatus(paidAmount, totals.grandTotal),
    notes: cleanString(req.body.notes),
  });

  res.status(201).json(await order.populate("client riceMill driver"));
}

async function update(req, res) {
  const order = await Order.findOne({ _id: req.params.id, owner: req.user.id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (req.body.client || req.body.clientId) {
    const client = await Client.findOne({ _id: req.body.client || req.body.clientId, owner: req.user.id });
    if (!client) return res.status(400).json({ message: "Invalid client" });
    order.client = client._id;
    order.clientName = client.name;
  }

  if (req.body.riceMill || req.body.riceMillId) {
    const riceMill = await RiceMill.findOne({ _id: req.body.riceMill || req.body.riceMillId, owner: req.user.id });
    if (!riceMill) return res.status(400).json({ message: "Invalid rice mill" });
    order.riceMill = riceMill._id;
    order.riceMillName = riceMill.name;
  }

  if (req.body.items) {
    const items = normalizeItems(req.body.items);
    if (!items.length) return res.status(400).json({ message: "At least one valid rice item is required" });
    order.items = items;
    order.totals = calculateTotals(items);
  }

  if (req.body.date || req.body.displayDate) {
    order.date = parseIndianDate(req.body.date || req.body.displayDate);
    order.displayDate = formatIndianDate(order.date);
  }

  const writable = ["lorryNumber", "transportName", "driverName", "notes"];
  for (const field of writable) if (req.body[field] !== undefined) order[field] = cleanString(req.body[field]);
  if (req.body.driverMobile !== undefined) order.driverMobile = cleanPhone(req.body.driverMobile);

  const paidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : order.paidAmount;
  order.paidAmount = Math.min(Math.max(Number(paidAmount) || 0, 0), order.totals.grandTotal);
  order.status = normalizeStatus(order.paidAmount, order.totals.grandTotal);
  const driver = await ensureDriver(req.user.id, order.driverName, order.driverMobile, order.lorryNumber);
  order.driver = driver?._id || null;
  await order.save();

  res.json(await order.populate("client riceMill driver"));
}

async function remove(req, res) {
  const deleted = await Order.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Order not found" });
  res.status(204).end();
}

module.exports = { list, create, update, remove };
