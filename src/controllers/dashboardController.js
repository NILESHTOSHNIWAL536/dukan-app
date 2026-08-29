const Order = require("../models/Order");
const Client = require("../models/Client");
const RiceMill = require("../models/RiceMill");
const Driver = require("../models/Driver");
const Expense = require("../models/Expense");

async function dashboard(req, res) {
  const owner = { owner: req.user.id };
  const [orders, expenses, clients, riceMills, drivers] = await Promise.all([
    Order.find(owner), Expense.find(owner), Client.countDocuments(owner), RiceMill.countDocuments(owner), Driver.countDocuments(owner),
  ]);

  const totals = orders.reduce((a, o) => {
    const total = Number(o.totals?.grandTotal || 0);
    a.sales += total; a.paid += Number(o.paidAmount || 0); return a;
  }, { sales: 0, paid: 0 });

  const expenseTotals = expenses.reduce((a, expense) => {
    a.amount += Number(expense.amount || 0);
    a.paid += Number(expense.paidAmount || 0);
    return a;
  }, { amount: 0, paid: 0 });

  res.json({
    clients, riceMills, drivers, orders: orders.length,
    sales: totals.sales, paid: totals.paid, due: totals.sales - totals.paid,
    expenses: expenseTotals.amount, expensePaid: expenseTotals.paid, expenseDue: expenseTotals.amount - expenseTotals.paid,
  });
}

module.exports = dashboard;
