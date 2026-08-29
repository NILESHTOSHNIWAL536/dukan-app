const Driver = require("../models/Driver");
const Expense = require("../models/Expense");
const { cleanPhone, cleanString } = require("../utils/normalize");

function statusFor(total, paid) {
  if (paid >= total && total > 0) return "Paid";
  if (paid > 0) return "Partial";
  return "Unpaid";
}

async function ensureDriver(owner, name, phone) {
  const driverName = cleanString(name);
  const driverMobile = cleanPhone(phone);
  if (!driverName || driverMobile.length !== 10) return null;

  return Driver.findOneAndUpdate(
    { owner, phone: driverMobile },
    { owner, name: driverName, phone: driverMobile },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function list(req, res) {
  res.json(await Expense.find({ owner: req.user.id }).populate("driver").sort({ createdAt: -1 }));
}

async function create(req, res) {
  const amount = Number(req.body.amount || 0);
  const paidAmount = Math.min(Math.max(Number(req.body.paidAmount || 0), 0), amount);
  const driverName = cleanString(req.body.driverName);
  const driverMobile = cleanPhone(req.body.driverMobile);

  if (!driverName || driverMobile.length !== 10 || amount <= 0) {
    return res.status(400).json({ message: "Driver name, mobile number and amount are required" });
  }

  const driver = await ensureDriver(req.user.id, driverName, driverMobile);
  const expense = await Expense.create({
    owner: req.user.id,
    driver: driver?._id || null,
    driverName,
    driverMobile,
    amount,
    paidAmount,
    remainingAmount: Math.max(amount - paidAmount, 0),
    paymentStatus: statusFor(amount, paidAmount),
    note: cleanString(req.body.note),
  });

  res.status(201).json(await expense.populate("driver"));
}

async function update(req, res) {
  const expense = await Expense.findOne({ _id: req.params.id, owner: req.user.id });
  if (!expense) return res.status(404).json({ message: "Expense not found" });

  if (req.body.driverName !== undefined) expense.driverName = cleanString(req.body.driverName);
  if (req.body.driverMobile !== undefined) expense.driverMobile = cleanPhone(req.body.driverMobile);
  if (req.body.amount !== undefined) expense.amount = Number(req.body.amount || 0);
  if (req.body.paidAmount !== undefined) expense.paidAmount = Number(req.body.paidAmount || 0);
  if (req.body.note !== undefined) expense.note = cleanString(req.body.note);

  expense.paidAmount = Math.min(Math.max(Number(expense.paidAmount || 0), 0), Number(expense.amount || 0));
  expense.remainingAmount = Math.max(Number(expense.amount || 0) - expense.paidAmount, 0);
  expense.paymentStatus = statusFor(Number(expense.amount || 0), expense.paidAmount);
  const driver = await ensureDriver(req.user.id, expense.driverName, expense.driverMobile);
  expense.driver = driver?._id || null;
  await expense.save();

  res.json(await expense.populate("driver"));
}

async function remove(req, res) {
  const deleted = await Expense.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!deleted) return res.status(404).json({ message: "Expense not found" });
  res.status(204).end();
}

module.exports = { list, create, update, remove };
