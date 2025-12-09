import Driver from "../models/driver.js";
import DriverSignup from "../models/driverSignup.js";
import { uploadToCloudinary } from "../lib/cloudinary.js";

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

// Helper function to upload documents
const uploadDriverDocuments = async (fields, driverId) => {
  const documentFields = [
    "profilePhoto",
    "licenseDocument",
    "aadharDocument",
    "aadharDocumentBack",
    "panDocument",
    "bankDocument",
    "electricBillDocument",
  ];
  const uploadedDocs = {};

  for (const field of documentFields) {
    if (fields[field] && fields[field].startsWith("data:")) {
      try {
        const result = await uploadToCloudinary(
          fields[field],
          `drivers/${driverId}/${field}`
        );
        uploadedDocs[field] = result.secure_url;
      } catch (uploadErr) {
        console.error(`Failed to upload ${field}:`, uploadErr);
      }
    }
  }

  return uploadedDocs;
};

/**
 * @desc    Get all manually added drivers
 * @route   GET /api/drivers
 * @access  Public
 */
export const getAllDrivers = async (req, res) => {
  try {
    const list = await Driver.find({ isManualEntry: true }).lean();
    res.json(list);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch drivers", error: error.message });
  }
};

/**
 * @desc    Get driver by ID
 * @route   GET /api/drivers/:id
 * @access  Public
 */
export const getDriverById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await Driver.findOne({ id }).lean();
    if (!item) {
      return res.status(404).json({ message: "Driver not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching driver:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch driver", error: error.message });
  }
};

/**
 * @desc    Get driver by mobile number
 * @route   GET /api/drivers/form/mobile/:phone
 * @access  Public
 */
export const getDriverByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const driver = await Driver.findOne({ phone }).lean();
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json({ driver });
  } catch (error) {
    console.error("Error fetching driver by phone:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch driver", message: error.message });
  }
};

/**
 * @desc    Create new driver
 * @route   POST /api/drivers
 * @access  Public
 */
export const createDriver = async (req, res) => {
  try {
    const fields = stripAuthFields(req.body);
    const max = await Driver.find().sort({ id: -1 }).limit(1).lean();
    const nextId = (max[0]?.id || 0) + 1;

    // Handle document uploads to Cloudinary
    const uploadedDocs = await uploadDriverDocuments(fields, nextId);

    const documentFields = [
      "profilePhoto",
      "licenseDocument",
      "aadharDocument",
      "aadharDocumentBack",
      "panDocument",
      "bankDocument",
      "electricBillDocument",
    ];

    // Add emergency contact relation and secondary phone
    const driverData = {
      id: nextId,
      ...fields,
      ...uploadedDocs,
      isManualEntry: true,
      emergencyRelation: fields.emergencyRelation || "",
      emergencyPhoneSecondary: fields.emergencyPhoneSecondary || "",
    };

    // Remove base64 data to prevent large document size
    documentFields.forEach((field) => {
      if (driverData[field]?.startsWith("data:")) {
        delete driverData[field];
      }
    });

    // Set registrationCompleted=true in DriverSignup if mobile matches
    if (driverData.mobile) {
      await DriverSignup.findOneAndUpdate(
        { mobile: driverData.mobile },
        { registrationCompleted: true, status: "active" }
      );
    }

    const newDriver = await Driver.create(driverData);
    res.status(201).json(newDriver);
  } catch (err) {
    console.error("Driver create error:", err);
    res
      .status(500)
      .json({ message: "Failed to create driver", error: err.message });
  }
};

/**
 * @desc    Update driver
 * @route   PUT /api/drivers/:id
 * @access  Public
 */
export const updateDriver = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const fields = stripAuthFields(req.body);

    // Handle document uploads to Cloudinary
    const uploadedDocs = await uploadDriverDocuments(fields, id);

    const documentFields = [
      "profilePhoto",
      "licenseDocument",
      "aadharDocument",
      "aadharDocumentBack",
      "panDocument",
      "bankDocument",
      "electricBillDocument",
    ];

    // Add emergency contact relation and secondary phone
    const updateData = {
      ...fields,
      ...uploadedDocs,
      emergencyRelation: fields.emergencyRelation || "",
      emergencyPhoneSecondary: fields.emergencyPhoneSecondary || "",
    };

    // Remove base64 data to prevent large document size
    documentFields.forEach((field) => {
      if (updateData[field]?.startsWith("data:")) {
        delete updateData[field];
      }
    });

    const updated = await Driver.findOneAndUpdate({ id }, updateData, {
      new: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Driver update error:", err);
    res
      .status(500)
      .json({ message: "Failed to update driver", error: err.message });
  }
};

/**
 * @desc    Delete driver
 * @route   DELETE /api/drivers/:id
 * @access  Public
 */
export const deleteDriver = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await Driver.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }
    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res
      .status(500)
      .json({ message: "Failed to delete driver", error: error.message });
  }
};

/**
 * @desc    Get all driver signup credentials
 * @route   GET /api/drivers/signup/credentials
 * @access  Public
 */
export const getDriverSignupCredentials = async (req, res) => {
  try {
    const list = await DriverSignup.find()
      .select("username mobile password status kycStatus signupDate")
      .lean();
    res.json(list);
  } catch (error) {
    console.error("Error fetching signup credentials:", error);
    res.status(500).json({ message: "Failed to fetch signup credentials" });
  }
};

/**
 * @desc    Update driver signup credential
 * @route   PUT /api/drivers/signup/credentials/:id
 * @access  Public
 */
export const updateDriverSignupCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DriverSignup.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Driver signup not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating driver signup:", err);
    res
      .status(400)
      .json({ message: "Failed to update driver signup", error: err.message });
  }
};

/**
 * @desc    Delete driver signup credential
 * @route   DELETE /api/drivers/signup/credentials/:id
 * @access  Public
 */
export const deleteDriverSignupCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DriverSignup.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Driver signup not found" });
    }
    res.json({ message: "Driver signup deleted", driver: deleted });
  } catch (err) {
    console.error("Error deleting driver signup:", err);
    res
      .status(400)
      .json({ message: "Failed to delete driver signup", error: err.message });
  }
};

/**
 * @desc    Get driver earnings summary
 * @route   GET /api/drivers/earnings/summary
 * @access  Public
 */
export const getDriverEarningsSummary = async (req, res) => {
  try {
    // Mock driver earnings data (replace with actual calculation from trips/payments)
    const driverEarnings = [
      {
        driverId: "DR001",
        driverName: "Rajesh Kumar",
        monthlyEarnings: 52000,
        totalTrips: 180,
        averageRating: 4.7,
        totalDistance: 1800,
        pendingAmount: 0,
        lastPayment: "2024-11-01",
      },
      {
        driverId: "DR002",
        driverName: "Priya Sharma",
        monthlyEarnings: 65000,
        totalTrips: 220,
        averageRating: 4.9,
        totalDistance: 2200,
        pendingAmount: 15725,
        lastPayment: "2024-10-25",
      },
      {
        driverId: "DR003",
        driverName: "Amit Singh",
        monthlyEarnings: 48000,
        totalTrips: 160,
        averageRating: 4.5,
        totalDistance: 1600,
        pendingAmount: 5000,
        lastPayment: "2024-11-02",
      },
      {
        driverId: "DR004",
        driverName: "Sunita Patel",
        monthlyEarnings: 42000,
        totalTrips: 145,
        averageRating: 4.6,
        totalDistance: 1450,
        pendingAmount: 10200,
        lastPayment: "2024-10-28",
      },
      {
        driverId: "DR005",
        driverName: "Vikram Reddy",
        monthlyEarnings: 58000,
        totalTrips: 195,
        averageRating: 4.8,
        totalDistance: 1950,
        pendingAmount: 0,
        lastPayment: "2024-11-03",
      },
    ];

    res.json(driverEarnings);
  } catch (err) {
    console.error("Error fetching driver earnings:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch driver earnings", error: err.message });
  }
};
