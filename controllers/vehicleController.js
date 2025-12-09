import Vehicle from "../models/vehicle.js";
import { uploadToCloudinary } from "../lib/cloudinary.js";

// Helper Functions
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

const normalizeVehicleShape = (v) => {
  const base = {
    // identity
    vehicleId: null,
    registrationNumber: "",

    // primary details
    category: "",
    brand: "",
    model: "",
    vehicleName: "",
    color: "",
    fuelType: "",
    ownerName: "",
    ownerPhone: "",
    year: null,
    manufactureYear: v?.manufactureYear ?? null,

    // dates and numbers
    registrationDate: "",
    rcExpiryDate: "",
    roadTaxDate: "",
    roadTaxNumber: "",
    insuranceDate: "",
    permitDate: "",
    emissionDate: "",
    pucNumber: "",
    trafficFine: v?.trafficFine ?? null,
    trafficFineDate: v?.trafficFineDate ?? "",

    // status
    status: v?.status ?? "inactive",
    kycStatus: v?.kycStatus ?? "pending",
    assignedDriver: "",
    remarks: v?.remarks ?? "",
    kycVerifiedDate: v?.kycVerifiedDate ?? null,

    // legacy docs
    insuranceDoc: null,
    rcDoc: null,
    permitDoc: null,
    pollutionDoc: null,
    fitnessDoc: null,

    // new photos
    registrationCardPhoto: null,
    roadTaxPhoto: null,
    pucPhoto: null,
    permitPhoto: null,
    carFrontPhoto: null,
    carLeftPhoto: null,
    carRightPhoto: null,
    carBackPhoto: null,
    carFullPhoto: null,

    // misc
    make: v?.make ?? "",
    purchaseDate: v?.purchaseDate ?? "",
    purchasePrice: v?.purchasePrice ?? null,
    currentValue: v?.currentValue ?? null,
    mileage: v?.mileage ?? null,
    lastService: v?.lastService ?? "",
    nextService: v?.nextService ?? "",
  };

  const merged = { ...base, ...(v || {}) };

  // Handle backward compatibility
  if (!merged.vehicleName && merged.carName) {
    merged.vehicleName = merged.carName;
  }

  return merged;
};

const uploadVehicleDocuments = async (data, identifier) => {
  const documentFields = [
    "insuranceDoc",
    "rcDoc",
    "permitDoc",
    "pollutionDoc",
    "fitnessDoc",
  ];
  const photoFields = [
    "registrationCardPhoto",
    "roadTaxPhoto",
    "pucPhoto",
    "permitPhoto",
    "carFrontPhoto",
    "carLeftPhoto",
    "carRightPhoto",
    "carBackPhoto",
    "carFullPhoto",
  ];
  const uploadedDocs = {};

  // Upload documents
  for (const field of documentFields) {
    if (data[field] && data[field].startsWith("data:")) {
      try {
        const result = await uploadToCloudinary(
          data[field],
          `vehicles/${identifier}/${field}`
        );
        uploadedDocs[field] = result.secure_url;
      } catch (uploadErr) {
        console.error(`Failed to upload ${field}:`, uploadErr);
      }
      delete data[field];
    }
  }

  // Upload photos
  for (const field of photoFields) {
    if (
      data[field] &&
      typeof data[field] === "string" &&
      data[field].startsWith("data:")
    ) {
      try {
        const result = await uploadToCloudinary(
          data[field],
          `vehicles/${identifier}/${field}`
        );
        uploadedDocs[field] = result.secure_url;
      } catch (uploadErr) {
        console.error(`Failed to upload ${field}:`, uploadErr);
      }
      delete data[field];
    }
  }

  return uploadedDocs;
};

/**
 * @desc    Get vehicle categories
 * @route   GET /api/vehicles/categories
 * @access  Public
 */
export const getCategories = async (req, res) => {
  try {
    res.json([
      { key: "Car", label: "Car" },
      { key: "Bike", label: "Bike" },
      { key: "Scooty", label: "Scooty" },
    ]);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

/**
 * @desc    Get vehicles by category with pagination
 * @route   GET /api/vehicles/by-category/:category
 * @access  Public
 */
export const getVehiclesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const {
      status = "active",
      kycStatus,
      isAvailable,
      page = 1,
      limit = 20,
    } = req.query;

    // Validate category
    const validCategories = ["Car", "Bike", "Scooty"];
    const normalizedCategory =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

    if (!validCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(
          ", "
        )}`,
      });
    }

    // Build query
    const query = { category: normalizedCategory };
    if (status) query.status = status;
    if (kycStatus) query.kycStatus = kycStatus;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === "true";

    const skip = (Number(page) - 1) * Number(limit);

    // Execute query with pagination
    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    const normalizedVehicles = vehicles.map((v) => normalizeVehicleShape(v));

    res.json({
      success: true,
      category: normalizedCategory,
      count: normalizedVehicles.length,
      total,
      vehicles: normalizedVehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Error filtering vehicles by category:", err);
    res.status(500).json({
      success: false,
      message: "Failed to filter vehicles by category",
    });
  }
};

/**
 * @desc    Get nearby vehicles based on location
 * @route   GET /api/vehicles/nearby
 * @access  Public
 */
export const getNearbyVehicles = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      category,
      maxDistance = 5000,
      availableOnly = "true",
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const maxDist = parseInt(maxDistance);

    if (isNaN(lat) || isNaN(lon) || isNaN(maxDist)) {
      return res.status(400).json({
        message: "Invalid coordinate or distance values",
      });
    }

    const query = {
      status: "active",
      "currentLocation.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          $maxDistance: maxDist,
        },
      },
    };

    if (availableOnly === "true") {
      query.isAvailable = true;
    }

    if (category) {
      query.category = category;
    }

    const vehicles = await Vehicle.find(query).limit(50).lean();

    // Add distance calculation for each vehicle
    const vehiclesWithDistance = vehicles.map((v) => {
      const normalized = normalizeVehicleShape(v);
      if (v.currentLocation && v.currentLocation.coordinates) {
        const [vLon, vLat] = v.currentLocation.coordinates;
        const R = 6371; // Earth radius in km
        const dLat = ((vLat - lat) * Math.PI) / 180;
        const dLon = ((vLon - lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((vLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        normalized.distanceKm = Math.round(R * c * 100) / 100;
      }
      return normalized;
    });

    res.json({
      count: vehiclesWithDistance.length,
      vehicles: vehiclesWithDistance,
    });
  } catch (err) {
    console.error("Error finding nearby vehicles:", err);
    res.status(500).json({ message: "Failed to find nearby vehicles" });
  }
};

/**
 * @desc    Search/filter vehicles
 * @route   GET /api/vehicles/search
 * @access  Public
 */
export const searchVehicles = async (req, res) => {
  try {
    const {
      q,
      registrationNumber,
      brand,
      category,
      model,
      vehicleName,
      color,
      fuelType,
      ownerName,
      ownerPhone,
      status,
      kycStatus,
      assignedDriver,
      assignedManager,
      minYear,
      maxYear,
    } = req.query;

    const filter = {};

    // General search across multiple fields
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [
        { registrationNumber: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { model: searchRegex },
        { vehicleName: searchRegex },
        { ownerName: searchRegex },
        { ownerPhone: searchRegex },
        { assignedDriver: searchRegex },
      ];
    }

    // Specific field filters
    if (registrationNumber)
      filter.registrationNumber = new RegExp(registrationNumber, "i");
    if (brand) filter.brand = new RegExp(brand, "i");
    if (category) filter.category = new RegExp(category, "i");
    if (model) filter.model = new RegExp(model, "i");
    if (vehicleName) filter.vehicleName = new RegExp(vehicleName, "i");
    if (color) filter.color = new RegExp(color, "i");
    if (fuelType) filter.fuelType = new RegExp(fuelType, "i");
    if (ownerName) filter.ownerName = new RegExp(ownerName, "i");
    if (ownerPhone) filter.ownerPhone = new RegExp(ownerPhone, "i");
    if (status) filter.status = status;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (assignedDriver) filter.assignedDriver = new RegExp(assignedDriver, "i");
    if (assignedManager)
      filter.assignedManager = new RegExp(assignedManager, "i");

    // Year range filter
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = Number(minYear);
      if (maxYear) filter.year.$lte = Number(maxYear);
    }

    const vehicles = await Vehicle.find(filter).lean();
    res.json(vehicles.map(normalizeVehicleShape));
  } catch (err) {
    console.error("Error searching vehicles:", err);
    res.status(500).json({ message: "Failed to search vehicles" });
  }
};

/**
 * @desc    Get all vehicles
 * @route   GET /api/vehicles
 * @access  Public
 */
export const getAllVehicles = async (req, res) => {
  try {
    const list = await Vehicle.find().lean();
    res.json(list.map(normalizeVehicleShape));
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
};

/**
 * @desc    Get vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Public
 */
export const getVehicleById = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const vehicle = await Vehicle.findOne({ vehicleId }).lean();
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json(normalizeVehicleShape(vehicle));
  } catch (err) {
    console.error("Error fetching vehicle:", err);
    res.status(500).json({ message: "Failed to fetch vehicle" });
  }
};

/**
 * @desc    Create new vehicle
 * @route   POST /api/vehicles
 * @access  Public
 */
export const createVehicle = async (req, res) => {
  try {
    if (!req.body.registrationNumber) {
      return res
        .status(400)
        .json({ message: "Registration number is required" });
    }

    const body = stripAuthFields(req.body);
    let vehicleData = {
      status: "inactive",
      kycStatus: "pending",
      ...body,
    };

    // Normalize and coerce basic types
    vehicleData.registrationNumber = (vehicleData.registrationNumber || "")
      .toString()
      .trim();
    if (vehicleData.year != null) vehicleData.year = Number(vehicleData.year);
    if (vehicleData.trafficFine != null)
      vehicleData.trafficFine = Number(vehicleData.trafficFine);

    // Handle backward compatibility for carName -> vehicleName
    if (!vehicleData.vehicleName && vehicleData.carName) {
      vehicleData.vehicleName = vehicleData.carName;
    }
    if (vehicleData.vehicleName && !vehicleData.carName) {
      vehicleData.carName = vehicleData.vehicleName;
    }

    // Upload documents
    const uploadedDocs = await uploadVehicleDocuments(
      vehicleData,
      vehicleData.registrationNumber
    );

    // Generate next vehicleId
    const latestVehicle = await Vehicle.findOne({}).sort({ vehicleId: -1 });
    const nextVehicleId = (latestVehicle?.vehicleId || 0) + 1;

    const vehicle = new Vehicle({
      ...vehicleData,
      ...uploadedDocs,
      vehicleId: nextVehicleId,
    });

    const savedVehicle = await vehicle.save();
    res.status(201).json(savedVehicle);
  } catch (err) {
    console.error("Error creating vehicle:", err);
    if (err && (err.code === 11000 || err.code === "11000")) {
      return res.status(409).json({ message: "Duplicate registration number" });
    }
    res.status(500).json({
      message: err?.message || "Failed to create vehicle",
    });
  }
};

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Public
 */
export const updateVehicle = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const updates = stripAuthFields(req.body);

    // Normalize/coerce
    if (updates.registrationNumber)
      updates.registrationNumber = String(updates.registrationNumber).trim();
    if (updates.year != null) updates.year = Number(updates.year);
    if (updates.trafficFine != null)
      updates.trafficFine = Number(updates.trafficFine);

    // Handle backward compatibility
    if (!updates.vehicleName && updates.carName) {
      updates.vehicleName = updates.carName;
    }
    if (updates.vehicleName && !updates.carName) {
      updates.carName = updates.vehicleName;
    }

    // Upload documents
    const uploadedDocs = await uploadVehicleDocuments(updates, vehicleId);

    let existing = await Vehicle.findOne({ vehicleId });

    // Track rent periods for each status change
    if (!existing.rentPeriods) existing.rentPeriods = [];

    if (updates.status === "active") {
      const lastPeriod = existing.rentPeriods[existing.rentPeriods.length - 1];
      if (!lastPeriod || lastPeriod.end) {
        existing.rentPeriods.push({ start: new Date(), end: null });
      }
      updates.rentPeriods = existing.rentPeriods;
      updates.rentStartDate = new Date();
      updates.rentPausedDate = null;
    }

    if (
      updates.status === "inactive" &&
      existing &&
      existing.status === "active"
    ) {
      const lastPeriod = existing.rentPeriods[existing.rentPeriods.length - 1];
      if (lastPeriod && !lastPeriod.end) {
        lastPeriod.end = new Date();
      }
      updates.rentPeriods = existing.rentPeriods;
      updates.rentPausedDate = new Date();
    }

    // KYC status activation logic
    if (
      updates.kycStatus === "active" &&
      (!existing || !existing.kycActivatedDate)
    ) {
      updates.kycActivatedDate = new Date();
    }
    if (updates.kycStatus === "inactive") {
      updates.kycActivatedDate = null;
    }

    // KYC verified logic
    if (
      updates.kycStatus === "active" &&
      (!existing || !existing.kycVerifiedDate)
    ) {
      updates.kycVerifiedDate = new Date();
    }
    if (updates.kycStatus === "inactive") {
      updates.kycVerifiedDate = null;
    }

    // Calculate total active months from rentPeriods
    let activeMonths = 0;
    let monthlyProfitMin =
      typeof updates !== "undefined" && updates.monthlyProfitMin !== undefined
        ? updates.monthlyProfitMin
        : existing.monthlyProfitMin || 0;
    if (Array.isArray(existing.rentPeriods)) {
      existing.rentPeriods.forEach((period) => {
        const start = new Date(period.start);
        const end = period.end ? new Date(period.end) : new Date();
        const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        activeMonths += Math.floor(diffDays / 30) + 1;
      });
    }
    updates.totalProfit = monthlyProfitMin * activeMonths;

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId },
      { ...updates, ...uploadedDocs },
      { new: true }
    ).lean();

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (err) {
    console.error("Error updating vehicle:", err);
    if (err && (err.code === 11000 || err.code === "11000")) {
      return res.status(409).json({ message: "Duplicate registration number" });
    }
    res.status(500).json({
      message: err?.message || "Failed to update vehicle",
    });
  }
};

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Public
 */
export const deleteVehicle = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const result = await Vehicle.deleteOne({ vehicleId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
};

/**
 * @desc    Get weekly rent slabs for vehicle
 * @route   GET /api/vehicles/:id/weekly-rent-slabs
 * @access  Public
 */
export const getWeeklyRentSlabs = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const vehicle = await Vehicle.findOne({ vehicleId }).lean();
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle.weeklyRentSlabs || []);
  } catch (err) {
    console.error("Error fetching weekly rent slabs:", err);
    res.status(500).json({ message: "Failed to fetch weekly rent slabs" });
  }
};

/**
 * @desc    Update weekly rent slabs for vehicle
 * @route   PUT /api/vehicles/:id/weekly-rent-slabs
 * @access  Public
 */
export const updateWeeklyRentSlabs = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const { slabs } = req.body;
    if (!Array.isArray(slabs))
      return res.status(400).json({ message: "slabs must be an array" });
    const updated = await Vehicle.findOneAndUpdate(
      { vehicleId },
      { weeklyRentSlabs: slabs },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ message: "Vehicle not found" });
    res.json(updated.weeklyRentSlabs);
  } catch (err) {
    console.error("Error updating weekly rent slabs:", err);
    res.status(500).json({ message: "Failed to update weekly rent slabs" });
  }
};

/**
 * @desc    Get daily rent slabs for vehicle
 * @route   GET /api/vehicles/:id/daily-rent-slabs
 * @access  Public
 */
export const getDailyRentSlabs = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const vehicle = await Vehicle.findOne({ vehicleId }).lean();
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle.dailyRentSlabs || []);
  } catch (err) {
    console.error("Error fetching daily rent slabs:", err);
    res.status(500).json({ message: "Failed to fetch daily rent slabs" });
  }
};

/**
 * @desc    Update daily rent slabs for vehicle
 * @route   PUT /api/vehicles/:id/daily-rent-slabs
 * @access  Public
 */
export const updateDailyRentSlabs = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const { slabs } = req.body;
    if (!Array.isArray(slabs))
      return res.status(400).json({ message: "slabs must be an array" });
    const updated = await Vehicle.findOneAndUpdate(
      { vehicleId },
      { dailyRentSlabs: slabs },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ message: "Vehicle not found" });
    res.json(updated.dailyRentSlabs);
  } catch (err) {
    console.error("Error updating daily rent slabs:", err);
    res.status(500).json({ message: "Failed to update daily rent slabs" });
  }
};

/**
 * @desc    Get monthly profit for vehicle
 * @route   GET /api/vehicles/:id/monthly-profit
 * @access  Public
 */
export const getMonthlyProfit = async (req, res) => {
  try {
    const vehicleId = Number(req.params.id);
    const vehicle = await Vehicle.findOne({ vehicleId }).lean();
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    let monthlyProfit = 0;
    if (vehicle.monthlyProfitMin && vehicle.monthlyProfitMin > 0) {
      monthlyProfit = vehicle.monthlyProfitMin;
    }

    res.json({ vehicleId, monthlyProfit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
