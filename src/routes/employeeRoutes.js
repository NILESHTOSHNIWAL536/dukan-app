const express = require("express");

const router = express.Router();

const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,

  addLeave,
  getLeaves,
  deleteLeave,

  addSalaryPayment,
  getSalaryPayments,
  deleteSalaryPayment,
} = require("../controllers/employeeController");

// =====================================================
// EMPLOYEE ROUTES
// =====================================================

// Create employee
// POST /api/employees
router.post("/", createEmployee);

// Get all employees
// GET /api/employees
router.get("/", getEmployees);

// Get single employee
// GET /api/employees/:id
router.get("/:id", getEmployeeById);

// Update employee
// PATCH /api/employees/:id
router.patch("/:id", updateEmployee);

// Delete employee
// DELETE /api/employees/:id
router.delete("/:id", deleteEmployee);


// =====================================================
// LEAVE ROUTES
// =====================================================

// Get employee leaves
// GET /api/employees/:id/leaves
router.get("/:id/leaves", getLeaves);

// Add employee leave
// POST /api/employees/:id/leaves
router.post("/:id/leaves", addLeave);

// Delete employee leave
// DELETE /api/employees/:id/leaves/:leaveId
router.delete(
  "/:id/leaves/:leaveId",
  deleteLeave
);


// =====================================================
// SALARY ROUTES
// =====================================================

// Get salary payment history
// GET /api/employees/:id/salary
router.get(
  "/:id/salary",
  getSalaryPayments
);

// Add salary payment
// POST /api/employees/:id/salary
router.post(
  "/:id/salary",
  addSalaryPayment
);

// Delete salary payment
// DELETE /api/employees/:id/salary/:paymentId
router.delete(
  "/:id/salary/:paymentId",
  deleteSalaryPayment
);


module.exports = router;