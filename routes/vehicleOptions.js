import express from 'express';
import VehicleOption from '../models/vehicleOption.js';

const router = express.Router();

// List options by type: /api/vehicle-options?type=brand
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    // Handle categories specially - return predefined categories
    if (type === 'category') {
      const categories = [
        { type: 'category', value: 'Car', valueLower: 'car' },
        { type: 'category', value: 'Bike', valueLower: 'bike' },
        { type: 'category', value: 'Scooty', valueLower: 'scooty' }
      ];
      return res.json(categories);
    }
    
    const filter = type ? { type } : {};
    const items = await VehicleOption.find(filter).sort({ valueLower: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('vehicle-options GET error', err);
    res.status(500).json({ message: 'Failed to load vehicle options' });
  }
});

// Create a new option
router.post('/', async (req, res) => {
  try {
    const { type, value } = req.body || {};
    if (!type || !value) return res.status(400).json({ message: 'type and value are required' });

    // Prevent adding custom categories - categories are predefined
    if (type === 'category') {
      const allowedCategories = ['Car', 'Bike', 'Scooty'];
      if (!allowedCategories.includes(value)) {
        return res.status(400).json({ message: 'Invalid category. Allowed categories are: Car, Bike, Scooty' });
      }
      // Return the predefined category (don't save to database)
      return res.status(200).json({ type, value, valueLower: value.toLowerCase() });
    }

    const option = new VehicleOption({ type, value });
    await option.save();
    res.status(201).json(option);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Option already exists' });
    }
    console.error('vehicle-options POST error', err);
    res.status(400).json({ message: 'Failed to create option' });
  }
});

// Optional: deactivate/delete
router.delete('/:id', async (req, res) => {
  try {
    const removed = await VehicleOption.findByIdAndDelete(req.params.id).lean();
    if (!removed) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('vehicle-options DELETE error', err);
    res.status(400).json({ message: 'Failed to delete option' });
  }
});

export default router;
