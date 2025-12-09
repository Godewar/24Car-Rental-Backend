import express from 'express';
import * as driverPlanSelectionController from '../controllers/driverPlanSelectionController.js';

const router = express.Router();

// Manager-specific routes (must come before /:id)
router.get('/by-manager/:manager', driverPlanSelectionController.getPaymentsByManager);

// Mobile-specific routes (must come before /:id)
router.get('/by-mobile/:mobile', driverPlanSelectionController.getPlansByMobile);

// Admin operations
router.get('/', driverPlanSelectionController.getAllPlanSelections);
router.patch('/:id', driverPlanSelectionController.updateExtraAmount);

// Specific actions (must come before generic /:id routes)
router.post('/:id/confirm-payment', driverPlanSelectionController.confirmPayment);
router.get('/:id/rent-summary', driverPlanSelectionController.getRentSummary);
router.put('/:id/status', driverPlanSelectionController.updatePlanStatus);

// CRUD operations
router.get('/:id', driverPlanSelectionController.getPlanSelectionById);
router.post('/', driverPlanSelectionController.authenticateDriver, driverPlanSelectionController.createPlanSelection);
router.put('/:id', driverPlanSelectionController.authenticateDriver, driverPlanSelectionController.updatePlanSelection);
router.delete('/:id', driverPlanSelectionController.deletePlanSelection);

export default router;
