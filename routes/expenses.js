import express from 'express';
import * as expenseController from '../controllers/expenseController.js';

const router = express.Router();

// Categories (must come before /:id)
router.get('/categories', expenseController.getCategories);

// CRUD operations
router.get('/', expenseController.getAllExpenses);
router.get('/:id', expenseController.getExpenseById);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

export default router;
