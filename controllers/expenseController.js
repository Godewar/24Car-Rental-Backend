import Expense from "../models/expense.js";

// Helper function to strip auth fields
const stripAuthFields = (source) => {
  if (!source || typeof source !== "object") return {};
  const disallowed = new Set([
    "token",
    "authToken",
    "accessToken",
    "authorization",
    "Authorization",
    "bearer",
    "Bearer",
  ]);
  const cleaned = {};
  for (const [k, v] of Object.entries(source)) {
    if (!disallowed.has(k)) cleaned[k] = v;
  }
  return cleaned;
};

/**
 * @desc    Get expense categories
 * @route   GET /api/expenses/categories
 * @access  Public
 */
export const getCategories = (req, res) => {
  res.json([
    { key: "fuel", label: "Fuel" },
    { key: "maintenance", label: "Maintenance" },
    { key: "insurance", label: "Insurance" },
    { key: "administrative", label: "Administrative" },
    { key: "salary", label: "Salary & Benefits" },
    { key: "marketing", label: "Marketing" },
    { key: "technology", label: "Technology" },
    { key: "other", label: "Other" },
  ]);
};

/**
 * @desc    Get all expenses
 * @route   GET /api/expenses
 * @access  Public
 */
export const getAllExpenses = async (req, res) => {
  try {
    const list = await Expense.find().lean();
    res.json(list);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};

/**
 * @desc    Get expense by ID
 * @route   GET /api/expenses/:id
 * @access  Public
 */
export const getExpenseById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await Expense.findOne({ id }).lean();
    if (!item) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json(item);
  } catch (err) {
    console.error("Error fetching expense:", err);
    res.status(500).json({ message: "Failed to fetch expense" });
  }
};

/**
 * @desc    Create new expense
 * @route   POST /api/expenses
 * @access  Public
 */
export const createExpense = async (req, res) => {
  try {
    const fields = stripAuthFields(req.body);
    const max = await Expense.find().sort({ id: -1 }).limit(1).lean();
    const nextId = (max[0]?.id || 0) + 1;

    const expenseData = { id: nextId, status: "pending", ...fields };
    const created = await Expense.create(expenseData);
    res.status(201).json(created);
  } catch (err) {
    console.error("Expense create error:", err);
    res.status(500).json({
      message: "Failed to create expense",
      error: err.message,
    });
  }
};

/**
 * @desc    Update expense
 * @route   PUT /api/expenses/:id
 * @access  Public
 */
export const updateExpense = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const fields = stripAuthFields(req.body);

    const updated = await Expense.findOneAndUpdate({ id }, fields, {
      new: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Expense update error:", err);
    res.status(500).json({
      message: "Failed to update expense",
      error: err.message,
    });
  }
};

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Public
 */
export const deleteExpense = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await Expense.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ message: "Failed to delete expense" });
  }
};
