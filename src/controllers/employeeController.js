const Employee = require("../models/Employee");
const EmployeeLeave = require("../models/EmployeeLeave");
const EmployeeSalary = require("../models/EmployeeSalary");

// =====================================================
// EMPLOYEE
// =====================================================

// CREATE EMPLOYEE
exports.createEmployee = async (req, res) => {
  try {
    const {
      name,
      phone,
      salaryMin,
      salaryMax,
      leavesPerMonth,
      image,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and phone are required",
      });
    }

    if (salaryMin === undefined || salaryMax === undefined) {
      return res.status(400).json({
        message: "Salary range is required",
      });
    }

    if (Number(salaryMin) > Number(salaryMax)) {
      return res.status(400).json({
        message: "Minimum salary cannot be greater than maximum salary",
      });
    }

    const employee = await Employee.create({
      name: name.trim(),
      phone: phone.trim(),
      salaryMin: Number(salaryMin),
      salaryMax: Number(salaryMax),
      leavesPerMonth:
        leavesPerMonth !== undefined &&
        leavesPerMonth !== null &&
        leavesPerMonth !== ""
          ? Number(leavesPerMonth)
          : null,
      image: image || null,
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error("Create employee error:", error);

    res.status(500).json({
      message: "Failed to create employee",
      error: error.message,
    });
  }
};


// GET ALL EMPLOYEES
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(employees);
  } catch (error) {
    console.error("Get employees error:", error);

    res.status(500).json({
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
};


// GET SINGLE EMPLOYEE
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Get leaves
    const leaves = await EmployeeLeave.find({
      employee: employee._id,
    })
      .sort({ date: -1 })
      .lean();

    // Get salary payments
    const salaryPayments = await EmployeeSalary.find({
      employee: employee._id,
    })
      .sort({ date: -1 })
      .lean();

    const totalPaid = salaryPayments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    res.json({
      ...employee,
      leaves,
      salaryPayments,
      totalPaid,
    });
  } catch (error) {
    console.error("Get employee error:", error);

    res.status(500).json({
      message: "Failed to fetch employee",
      error: error.message,
    });
  }
};


// UPDATE EMPLOYEE
exports.updateEmployee = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "salaryMin",
      "salaryMax",
      "leavesPerMonth",
      "image",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (updateData.phone) {
      updateData.phone = updateData.phone.trim();
    }

    if (updateData.salaryMin !== undefined) {
      updateData.salaryMin = Number(updateData.salaryMin);
    }

    if (updateData.salaryMax !== undefined) {
      updateData.salaryMax = Number(updateData.salaryMax);
    }

    if (
      updateData.salaryMin !== undefined &&
      updateData.salaryMax !== undefined &&
      updateData.salaryMin > updateData.salaryMax
    ) {
      return res.status(400).json({
        message: "Minimum salary cannot be greater than maximum salary",
      });
    }

    if (updateData.leavesPerMonth !== undefined) {
      updateData.leavesPerMonth =
        updateData.leavesPerMonth === null ||
        updateData.leavesPerMonth === ""
          ? null
          : Number(updateData.leavesPerMonth);
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json(employee);
  } catch (error) {
    console.error("Update employee error:", error);

    res.status(500).json({
      message: "Failed to update employee",
      error: error.message,
    });
  }
};


// DELETE EMPLOYEE
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Delete employee leaves
    await EmployeeLeave.deleteMany({
      employee: employee._id,
    });

    // Delete salary records
    await EmployeeSalary.deleteMany({
      employee: employee._id,
    });

    // Delete employee
    await Employee.findByIdAndDelete(employee._id);

    res.status(204).send();
  } catch (error) {
    console.error("Delete employee error:", error);

    res.status(500).json({
      message: "Failed to delete employee",
      error: error.message,
    });
  }
};


// =====================================================
// LEAVES
// =====================================================

// ADD LEAVE
exports.addLeave = async (req, res) => {
  try {
    const { date, reason, status } = req.body;

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (!date) {
      return res.status(400).json({
        message: "Leave date is required",
      });
    }

    const leave = await EmployeeLeave.create({
      employee: employee._id,
      date: new Date(date),
      reason: reason || "",
      status: status || "Leave",
    });

    res.status(201).json(leave);
  } catch (error) {
    console.error("Add leave error:", error);

    res.status(500).json({
      message: "Failed to add leave",
      error: error.message,
    });
  }
};


// GET LEAVES
exports.getLeaves = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const leaves = await EmployeeLeave.find({
      employee: employee._id,
    })
      .sort({ date: -1 })
      .lean();

    res.json(leaves);
  } catch (error) {
    console.error("Get leaves error:", error);

    res.status(500).json({
      message: "Failed to fetch leaves",
      error: error.message,
    });
  }
};


// DELETE LEAVE
exports.deleteLeave = async (req, res) => {
  try {
    const leave = await EmployeeLeave.findOne({
      _id: req.params.leaveId,
      employee: req.params.id,
    });

    if (!leave) {
      return res.status(404).json({
        message: "Leave not found",
      });
    }

    await EmployeeLeave.findByIdAndDelete(leave._id);

    res.status(204).send();
  } catch (error) {
    console.error("Delete leave error:", error);

    res.status(500).json({
      message: "Failed to delete leave",
      error: error.message,
    });
  }
};


// =====================================================
// SALARY
// =====================================================

// ADD SALARY PAYMENT
exports.addSalaryPayment = async (req, res) => {
  try {
    const {
      amount,
      date,
      month,
      note,
    } = req.body;

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Valid payment amount is required",
      });
    }

    if (!month) {
      return res.status(400).json({
        message: "Salary month is required",
      });
    }

    const payment = await EmployeeSalary.create({
      employee: employee._id,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      month,
      note: note || "",
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error("Add salary payment error:", error);

    res.status(500).json({
      message: "Failed to add salary payment",
      error: error.message,
    });
  }
};


// GET SALARY PAYMENTS
exports.getSalaryPayments = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const payments = await EmployeeSalary.find({
      employee: employee._id,
    })
      .sort({ date: -1 })
      .lean();

    const totalPaid = payments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

    res.json({
      payments,
      totalPaid,
    });
  } catch (error) {
    console.error("Get salary payments error:", error);

    res.status(500).json({
      message: "Failed to fetch salary payments",
      error: error.message,
    });
  }
};


// DELETE SALARY PAYMENT
exports.deleteSalaryPayment = async (req, res) => {
  try {
    const payment = await EmployeeSalary.findOne({
      _id: req.params.paymentId,
      employee: req.params.id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Salary payment not found",
      });
    }

    await EmployeeSalary.findByIdAndDelete(payment._id);

    res.status(204).send();
  } catch (error) {
    console.error("Delete salary payment error:", error);

    res.status(500).json({
      message: "Failed to delete salary payment",
      error: error.message,
    });
  }
};