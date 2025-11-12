import express from 'express';

const router = express.Router();

// Static vehicle rent slabs moved from frontend
let vehiclePlanSlabs = {
  'Wagon R': {
    securityDeposit: 12000,
    rows: [
      { trips: '0 - 59', rentDay: 890, weeklyRent: 6230, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '60', rentDay: 750, weeklyRent: 5250, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '75', rentDay: 650, weeklyRent: 4550, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '100', rentDay: 500, weeklyRent: 3500, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '115', rentDay: 370, weeklyRent: 2590, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '130', rentDay: 300, weeklyRent: 2100, accidentalCover: 105, acceptanceRate: 60 }
    ]
  },
  'Spresso': {
    securityDeposit: 12000,
    rows: [
      { trips: '0 - 59', rentDay: 850, weeklyRent: 5950, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '60', rentDay: 700, weeklyRent: 4900, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '75', rentDay: 600, weeklyRent: 4200, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '100', rentDay: 450, weeklyRent: 3150, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '115', rentDay: 250, weeklyRent: 1750, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '130', rentDay: 100, weeklyRent: 700, accidentalCover: 105, acceptanceRate: 60 }
    ]
  },
  'Sedan': {
    securityDeposit: 15000,
    rows: [
      { trips: '0 - 59', rentDay: 990, weeklyRent: 6930, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '60', rentDay: 890, weeklyRent: 6230, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '75', rentDay: 770, weeklyRent: 5390, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '100', rentDay: 650, weeklyRent: 4550, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '115', rentDay: 550, weeklyRent: 3850, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '130', rentDay: 400, weeklyRent: 2800, accidentalCover: 105, acceptanceRate: 60 }
    ]
  },
  'EIP': {
    securityDeposit: 10000,
    rows: [
      { trips: '0 - 59', rentDay: 900, weeklyRent: 6300, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '60', rentDay: 750, weeklyRent: 5250, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '75', rentDay: 650, weeklyRent: 4550, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '100', rentDay: 500, weeklyRent: 3500, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '115', rentDay: 400, weeklyRent: 2800, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '130', rentDay: 300, weeklyRent: 2100, accidentalCover: 105, acceptanceRate: 60 }
    ]
  },
  '2:1 Driver Rent': {
    securityDeposit: 15000,
    rows: [
      { trips: '0 - 59', rentDay: 1200, weeklyRent: 8400, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '60', rentDay: 1050, weeklyRent: 7350, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '75', rentDay: 975, weeklyRent: 6825, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '100', rentDay: 750, weeklyRent: 5250, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '115', rentDay: 550, weeklyRent: 3850, accidentalCover: 105, acceptanceRate: 60 },
      { trips: '130', rentDay: 450, weeklyRent: 3150, accidentalCover: 105, acceptanceRate: 60 }
    ]
  }
};

router.get('/', (req, res) => {
  res.json(vehiclePlanSlabs);
});

// PUT - Update a specific vehicle plan
router.put('/:vehicleName', (req, res) => {
  try {
    const { vehicleName } = req.params;
    const { securityDeposit, rows } = req.body;
    
    if (!vehiclePlanSlabs[vehicleName]) {
      return res.status(404).json({ error: 'Vehicle plan not found' });
    }
    
    // Update the vehicle plan
    vehiclePlanSlabs[vehicleName] = {
      securityDeposit: securityDeposit ?? vehiclePlanSlabs[vehicleName].securityDeposit,
      rows: rows ?? vehiclePlanSlabs[vehicleName].rows
    };
    
    res.json(vehiclePlanSlabs[vehicleName]);
  } catch (error) {
    console.error('Error updating vehicle plan:', error);
    res.status(400).json({ error: 'Failed to update vehicle plan', message: error.message });
  }
});

export default router;
