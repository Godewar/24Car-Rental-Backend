import express from 'express';
import Driver from '../models/driver.js';

const router = express.Router();

// Signup (username/password)
router.post('/signup', async (req, res) => {
	try {
		const { username, mobile, password } = req.body;
		if (!username || !mobile || !password) {
			return res.status(400).json({ message: 'Username, mobile and password required.' });
		}

		// Check for duplicate username
		const existingUsername = await Driver.findOne({ username });
		if (existingUsername) {
			return res.status(400).json({ message: 'Username already exists.' });
		}

		// Check for duplicate mobile
		const existingMobile = await Driver.findOne({ mobile });
		if (existingMobile) {
			return res.status(400).json({ message: 'Mobile number already registered.' });
		}

		// Create new driver (password stored in plain text)
		const driver = new Driver({ 
			username, 
			mobile, 
			password,
			status: 'pending',
			kycStatus: 'pending'
		});
		await driver.save();

		return res.json({ 
			message: 'Signup successful.',
			driver: {
				id: driver._id,
				username: driver.username,
				mobile: driver.mobile,
				name: driver.name
			}
		});
	} catch (error) {
		console.error('Signup error:', error);
		return res.status(500).json({ message: 'Server error during signup.' });
	}
});

// Login (username/password)
router.post('/login', async (req, res) => {
	try {
		const { username, password } = req.body;
		if (!username || !password) {
			return res.status(400).json({ message: 'Username and password required.' });
		}

		// Find driver by username
		const driver = await Driver.findOne({ username });
		if (!driver) {
			return res.status(401).json({ message: 'Invalid credentials.' });
		}

		// Verify password (plain text comparison)
		if (driver.password !== password) {
			return res.status(401).json({ message: 'Invalid credentials.' });
		}

		return res.json({ 
			message: 'Login successful.',
			driver: {
				id: driver._id,
				username: driver.username,
				mobile: driver.mobile,
				name: driver.name
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({ message: 'Server error during login.' });
	}
});

// Signup/login with OTP (OTP must match password)
router.post('/signup-otp', async (req, res) => {
	try {
		const { mobile, otp, username } = req.body;
		if (!mobile || !otp) {
			return res.status(400).json({ message: 'Mobile and OTP required.' });
		}

		// Check for duplicate mobile
		const existingMobile = await Driver.findOne({ mobile });
		if (existingMobile) {
			return res.status(400).json({ message: 'Mobile number already registered.' });
		}

		// Create new driver with OTP as password (plain text)
		const driver = new Driver({ 
			username: username || undefined,
			mobile, 
			password: otp,
			status: 'pending',
			kycStatus: 'pending'
		});
		await driver.save();

		return res.json({ 
			message: 'Signup successful.',
			driver: {
				id: driver._id,
				username: driver.username,
				mobile: driver.mobile,
				name: driver.name
			}
		});
	} catch (error) {
		console.error('Signup OTP error:', error);
		return res.status(500).json({ message: 'Server error during signup.' });
	}
});

router.post('/login-otp', async (req, res) => {
	try {
		const { mobile, otp } = req.body;
		if (!mobile || !otp) {
			return res.status(400).json({ message: 'Mobile and OTP required.' });
		}

		// Find driver by mobile
		const driver = await Driver.findOne({ mobile });
		if (!driver) {
			return res.status(401).json({ message: 'Invalid mobile number or OTP.' });
		}

		// Verify OTP matches the password stored during signup (plain text comparison)
		if (driver.password !== otp) {
			return res.status(401).json({ message: 'Invalid mobile number or OTP.' });
		}

		return res.json({ 
			message: 'Login successful.',
			driver: {
				id: driver._id,
				username: driver.username,
				mobile: driver.mobile,
				name: driver.name
			}
		});
	} catch (error) {
		console.error('Login OTP error:', error);
		return res.status(500).json({ message: 'Server error during login.' });
	}
});

export default router;
