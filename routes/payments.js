import express from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Zwitch payment gateway integration
router.get('/zwitch/test', paymentController.verifyAuth, paymentController.testZwitchConfig);
router.post('/zwitch/payout', paymentController.verifyAuth, paymentController.processZwitchPayout);
router.get('/zwitch/status/:referenceId', paymentController.verifyAuth, paymentController.getZwitchPayoutStatus);
router.post('/zwitch/verify-account', paymentController.verifyAuth, paymentController.verifyBankAccount);
router.post('/zwitch/webhook', express.json(), paymentController.handleZwitchWebhook);

// Driver payments management
router.get('/drivers', paymentController.verifyAuth, paymentController.getAllDriverPayments);
router.get('/drivers/:id', paymentController.verifyAuth, paymentController.getDriverPaymentById);
router.post('/drivers/create', paymentController.verifyAuth, paymentController.createDriverPayment);
router.put('/drivers/:id', paymentController.verifyAuth, paymentController.updateDriverPayment);
router.delete('/drivers/:id', paymentController.verifyAuth, paymentController.deleteDriverPayment);

export default router;
