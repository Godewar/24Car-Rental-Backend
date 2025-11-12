import express from 'express';
import InvestmentFD from '../models/investmentFD.js';

const router = express.Router();

// GET all investment FDs
router.get('/', async (req, res) => {
  try {
    const investments = await InvestmentFD.find().sort({ investmentDate: -1 });
    res.json(investments);
  } catch (error) {
    console.error('Error fetching investment FDs:', error);
    res.status(500).json({ error: 'Failed to fetch investment FDs', message: error.message });
  }
});

// GET single investment FD by ID
router.get('/:id', async (req, res) => {
  try {
    const investment = await InvestmentFD.findById(req.params.id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment FD not found' });
    }
    res.json(investment);
  } catch (error) {
    console.error('Error fetching investment FD:', error);
    res.status(500).json({ error: 'Failed to fetch investment FD', message: error.message });
  }
});

// POST - Create new investment FD
router.post('/', async (req, res) => {
  try {
    const {
      investorName,
      email,
      phone,
      address,
      investmentDate,
      paymentMethod,
      investmentRate,
      investmentAmount,
      status,
      maturityDate,
      notes
    } = req.body;

    // Validation
    if (!investorName || !phone || !address || !investmentDate || !paymentMethod || !investmentRate || !investmentAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate payment method
    const validPaymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'UPI'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Validate numbers
    if (isNaN(investmentRate) || parseFloat(investmentRate) < 0) {
      return res.status(400).json({ error: 'Invalid investment rate' });
    }
    if (isNaN(investmentAmount) || parseFloat(investmentAmount) <= 0) {
      return res.status(400).json({ error: 'Invalid investment amount' });
    }

    // Create new investment FD
    const newInvestment = new InvestmentFD({
      investorName: investorName.trim(),
      email: email ? email.trim() : '',
      phone: phone.trim(),
      address: address.trim(),
      investmentDate: new Date(investmentDate),
      paymentMethod,
      investmentRate: parseFloat(investmentRate),
      investmentAmount: parseFloat(investmentAmount),
      status: status || 'active',
      maturityDate: maturityDate ? new Date(maturityDate) : null,
      notes: notes || ''
    });

    const savedInvestment = await newInvestment.save();
    res.status(201).json(savedInvestment);
  } catch (error) {
    console.error('Error creating investment FD:', error);
    res.status(500).json({ error: 'Failed to create investment FD', message: error.message });
  }
});

// PUT - Update investment FD
router.put('/:id', async (req, res) => {
  try {
    const {
      investorName,
      email,
      phone,
      address,
      investmentDate,
      paymentMethod,
      investmentRate,
      investmentAmount,
      status,
      maturityDate,
      notes
    } = req.body;

    // Find investment
    const investment = await InvestmentFD.findById(req.params.id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment FD not found' });
    }

    // Validate payment method if provided
    if (paymentMethod) {
      const validPaymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'UPI'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ error: 'Invalid payment method' });
      }
    }

    // Validate numbers if provided
    if (investmentRate !== undefined && (isNaN(investmentRate) || parseFloat(investmentRate) < 0)) {
      return res.status(400).json({ error: 'Invalid investment rate' });
    }
    if (investmentAmount !== undefined && (isNaN(investmentAmount) || parseFloat(investmentAmount) <= 0)) {
      return res.status(400).json({ error: 'Invalid investment amount' });
    }

    // Update fields
    if (investorName !== undefined) investment.investorName = investorName.trim();
    if (email !== undefined) investment.email = email.trim();
    if (phone !== undefined) investment.phone = phone.trim();
    if (address !== undefined) investment.address = address.trim();
    if (investmentDate !== undefined) investment.investmentDate = new Date(investmentDate);
    if (paymentMethod !== undefined) investment.paymentMethod = paymentMethod;
    if (investmentRate !== undefined) investment.investmentRate = parseFloat(investmentRate);
    if (investmentAmount !== undefined) investment.investmentAmount = parseFloat(investmentAmount);
    if (status !== undefined) investment.status = status;
    if (maturityDate !== undefined) investment.maturityDate = maturityDate ? new Date(maturityDate) : null;
    if (notes !== undefined) investment.notes = notes;

    const updatedInvestment = await investment.save();
    res.json(updatedInvestment);
  } catch (error) {
    console.error('Error updating investment FD:', error);
    res.status(500).json({ error: 'Failed to update investment FD', message: error.message });
  }
});

// DELETE - Remove investment FD
router.delete('/:id', async (req, res) => {
  try {
    const investment = await InvestmentFD.findByIdAndDelete(req.params.id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment FD not found' });
    }
    res.json({ message: 'Investment FD deleted successfully', investment });
  } catch (error) {
    console.error('Error deleting investment FD:', error);
    res.status(500).json({ error: 'Failed to delete investment FD', message: error.message });
  }
});

// GET statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const [totalInvestments, activeInvestments, stats] = await Promise.all([
      InvestmentFD.countDocuments(),
      InvestmentFD.countDocuments({ status: 'active' }),
      InvestmentFD.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$investmentAmount' },
            avgRate: { $avg: '$investmentRate' }
          }
        }
      ])
    ]);

    res.json({
      totalInvestments,
      activeInvestments,
      totalAmount: stats[0]?.totalAmount || 0,
      avgRate: stats[0]?.avgRate || 0
    });
  } catch (error) {
    console.error('Error fetching investment FD stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', message: error.message });
  }
});

export default router;
