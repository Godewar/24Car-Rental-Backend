import Booking from "../models/booking.js";
import Vehicle from "../models/vehicle.js";
import {
  calculateRentalPrice,
  calculateExtraKmCharges,
  calculateLateReturnCharges,
  calculateCancellationFee,
  getAllRentalPackages,
  calculateDuration,
} from "../lib/rentalPricing.js";

/**
 * @desc    Get rental price estimate for all categories
 * @route   POST /api/bookings/estimate-price
 * @access  Public
 */
export const estimatePrice = async (req, res) => {
  try {
    const { pickupDate, returnDate, category, insuranceType, extras } =
      req.body;

    if (!pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: "Pickup and return dates are required",
      });
    }

    if (category) {
      // Get estimate for specific category
      const estimate = calculateRentalPrice({
        category,
        pickupDate,
        returnDate,
        insuranceType: insuranceType || "basic",
        extras: extras || {},
      });

      return res.json({
        success: true,
        estimate,
      });
    } else {
      // Get estimates for all categories
      const estimates = getAllRentalPackages(pickupDate, returnDate);

      return res.json({
        success: true,
        estimates,
      });
    }
  } catch (err) {
    console.error("Error estimating price:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to estimate price",
    });
  }
};

/**
 * @desc    Search available vehicles by location, category and dates
 * @route   POST /api/bookings/search-vehicles
 * @access  Public
 */
export const searchVehicles = async (req, res) => {
  try {
    const {
      pickupDate,
      returnDate,
      city,
      category,
      latitude,
      longitude,
      maxDistance = 10000, // 10km default
    } = req.body;

    if (!pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: "Pickup and return dates are required",
      });
    }

    // Build query
    const query = {
      status: "active",
      isAvailable: true,
    };

    if (category) {
      query.category = category;
    }

    if (city) {
      query["currentLocation.city"] = new RegExp(city, "i");
    }

    // Add location-based search if coordinates provided
    if (latitude && longitude) {
      query["currentLocation.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      };
    }

    // Find vehicles
    let vehicles = await Vehicle.find(query).limit(50).lean();

    // Check availability for each vehicle
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);

    const availableVehicles = [];

    for (const vehicle of vehicles) {
      const isAvailable = await Booking.checkVehicleAvailability(
        vehicle.vehicleId,
        pickup,
        returnD
      );

      if (isAvailable) {
        // Calculate pricing
        const pricing = calculateRentalPrice({
          category: vehicle.category,
          pickupDate: pickup,
          returnDate: returnD,
        });

        availableVehicles.push({
          ...vehicle,
          pricing: pricing.pricing,
          rentalPackage: pricing.rentalPackage,
          duration: pricing.duration,
        });
      }
    }

    res.json({
      success: true,
      count: availableVehicles.length,
      vehicles: availableVehicles,
    });
  } catch (err) {
    console.error("Error searching vehicles:", err);
    res.status(500).json({
      success: false,
      message: "Failed to search vehicles",
    });
  }
};

/**
 * @desc    Create a new rental booking
 * @route   POST /api/bookings
 * @access  Public
 */
export const createBooking = async (req, res) => {
  try {
    const {
      driverName,
      driverPhone,
      driverEmail,
      driverAge,
      vehicleId,
      pickupDate,
      returnDate,
      pickupStation,
      returnStation,
      insuranceType = "basic",
      extras = {},
      drivingLicense,
      aadharCard,
      purposeOfTrip,
      emergencyContact,
      paymentMethod = "card",
    } = req.body;

    // Validate required fields
    if (
      !driverName ||
      !driverPhone ||
      !vehicleId ||
      !pickupDate ||
      !returnDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate dates
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const now = new Date();

    if (pickup < now) {
      return res.status(400).json({
        success: false,
        message: "Pickup date cannot be in the past",
      });
    }

    if (returnD <= pickup) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after pickup date",
      });
    }

    // Find vehicle
    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check vehicle availability
    const isAvailable = await Booking.checkVehicleAvailability(
      vehicleId,
      pickup,
      returnD
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Vehicle is not available for the selected dates",
      });
    }

    // Calculate pricing
    const pricingData = calculateRentalPrice({
      category: vehicle.category,
      pickupDate: pickup,
      returnDate: returnD,
      insuranceType,
      extras,
    });

    // Create booking
    const booking = new Booking({
      driverName,
      driverPhone,
      driverEmail,
      driverAge,
      vehicleId: vehicle.vehicleId,
      vehicleCategory: vehicle.category,
      vehicleName: vehicle.vehicleName || vehicle.model,
      registrationNumber: vehicle.registrationNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      fuelType: vehicle.fuelType,
      rentalPackage: pricingData.rentalPackage,
      duration: pricingData.duration,
      pricing: pricingData.pricing,
      scheduledPickupDate: pickup,
      scheduledReturnDate: returnD,
      pickupStation: pickupStation || {
        stationName: vehicle.currentLocation?.address || "Main Station",
        address: vehicle.currentLocation?.address,
        city: vehicle.currentLocation?.city,
        state: vehicle.currentLocation?.state,
        coordinates: vehicle.currentLocation?.coordinates,
      },
      returnStation: returnStation ||
        pickupStation || {
          stationName: vehicle.currentLocation?.address || "Main Station",
          address: vehicle.currentLocation?.address,
          city: vehicle.currentLocation?.city,
          state: vehicle.currentLocation?.state,
          coordinates: vehicle.currentLocation?.coordinates,
        },
      differentReturnLocation: !!returnStation,
      drivingLicense: drivingLicense || {},
      aadharCard: aadharCard || {},
      purposeOfTrip,
      emergencyContact,
      paymentMethod,
      status: "pending_verification",
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message:
        "Booking created successfully. Please complete document verification.",
      booking,
      pricingBreakdown: pricingData.breakdown,
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create booking",
    });
  }
};

/**
 * @desc    Get all bookings with filters
 * @route   GET /api/bookings
 * @access  Public
 */
export const getAllBookings = async (req, res) => {
  try {
    const {
      status,
      driverPhone,
      vehicleId,
      category,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (driverPhone) filter.driverPhone = driverPhone;
    if (vehicleId) filter.vehicleId = Number(vehicleId);
    if (category) filter.vehicleCategory = category;

    if (fromDate || toDate) {
      filter.scheduledPickupDate = {};
      if (fromDate) filter.scheduledPickupDate.$gte = new Date(fromDate);
      if (toDate) filter.scheduledPickupDate.$lte = new Date(toDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/bookings/:id
 * @access  Public
 */
export const getBookingById = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const booking = await Booking.findOne({ bookingId }).lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};

/**
 * @desc    Update booking status
 * @route   PATCH /api/bookings/:id/status
 * @access  Public
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { status, notes, updatedBy = "admin" } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Update booking status
    await booking.updateStatus(status, updatedBy, notes);

    // Handle vehicle availability
    const vehicle = await Vehicle.findOne({ vehicleId: booking.vehicleId });
    if (vehicle) {
      if (status === "active") {
        vehicle.isAvailable = false;
        vehicle.currentBookingId = bookingId;
      } else if (
        status === "completed" ||
        status === "cancelled" ||
        status === "no_show"
      ) {
        vehicle.isAvailable = true;
        vehicle.currentBookingId = null;
      }
      await vehicle.save();
    }

    res.json({
      success: true,
      message: "Booking status updated",
      booking,
    });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
    });
  }
};

/**
 * @desc    Process vehicle pickup
 * @route   POST /api/bookings/:id/pickup
 * @access  Public
 */
export const processPickup = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { pickupCondition, checkedBy } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "vehicle_ready" && booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Booking is not ready for pickup",
      });
    }

    booking.actualPickupDate = new Date();
    booking.pickupCondition = {
      ...pickupCondition,
      checkedBy,
      checkedAt: new Date(),
    };
    await booking.updateStatus("active", checkedBy, "Vehicle picked up");

    // Mark vehicle as unavailable
    const vehicle = await Vehicle.findOne({ vehicleId: booking.vehicleId });
    if (vehicle) {
      vehicle.isAvailable = false;
      vehicle.currentBookingId = bookingId;
      await vehicle.save();
    }

    res.json({
      success: true,
      message: "Vehicle picked up successfully",
      booking,
    });
  } catch (err) {
    console.error("Error processing pickup:", err);
    res.status(500).json({
      success: false,
      message: "Failed to process pickup",
    });
  }
};

/**
 * @desc    Process vehicle return
 * @route   POST /api/bookings/:id/return
 * @access  Public
 */
export const processReturn = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { returnCondition, checkedBy } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "active" && booking.status !== "extended") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status for return",
      });
    }

    const actualReturn = new Date();
    booking.actualReturnDate = actualReturn;
    booking.returnCondition = {
      ...returnCondition,
      checkedBy,
      checkedAt: actualReturn,
    };

    // Calculate extra KM charges
    if (
      returnCondition.odometerReading &&
      booking.pickupCondition?.odometerReading
    ) {
      const kmDriven =
        returnCondition.odometerReading -
        booking.pickupCondition.odometerReading;
      booking.pricing.actualKmDriven = kmDriven;

      const extraKmCharges = calculateExtraKmCharges(
        booking.pricing.includedKm,
        kmDriven,
        booking.pricing.extraKmRate
      );
      booking.pricing.extraKmCharges = extraKmCharges;
    }

    // Calculate late return charges
    const lateCharges = calculateLateReturnCharges(
      booking.scheduledReturnDate,
      actualReturn,
      booking.vehicleCategory
    );

    if (lateCharges.isLate) {
      booking.isLateReturn = true;
      booking.lateReturnCharges = lateCharges.charges;
    }

    // Recalculate total
    booking.calculateTotalAmount();

    await booking.updateStatus("completed", checkedBy, "Vehicle returned");

    // Mark vehicle as available
    const vehicle = await Vehicle.findOne({ vehicleId: booking.vehicleId });
    if (vehicle) {
      vehicle.isAvailable = true;
      vehicle.currentBookingId = null;
      await vehicle.save();
    }

    res.json({
      success: true,
      message: "Vehicle returned successfully",
      booking,
      additionalCharges: {
        extraKm: booking.pricing.extraKmCharges || 0,
        lateReturn: booking.lateReturnCharges || 0,
      },
    });
  } catch (err) {
    console.error("Error processing return:", err);
    res.status(500).json({
      success: false,
      message: "Failed to process return",
    });
  }
};

/**
 * @desc    Request booking extension
 * @route   POST /api/bookings/:id/extend
 * @access  Public
 */
export const extendBooking = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { newReturnDate, reason } = req.body;

    if (!newReturnDate) {
      return res.status(400).json({
        success: false,
        message: "New return date is required",
      });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active bookings can be extended",
      });
    }

    const newReturn = new Date(newReturnDate);
    const currentReturn = new Date(booking.scheduledReturnDate);

    if (newReturn <= currentReturn) {
      return res.status(400).json({
        success: false,
        message: "New return date must be after current return date",
      });
    }

    // Calculate additional charges
    const duration = calculateDuration(currentReturn, newReturn);
    const additionalPricing = calculateRentalPrice({
      category: booking.vehicleCategory,
      pickupDate: currentReturn,
      returnDate: newReturn,
      insuranceType: booking.pricing.insuranceType,
      extras: {},
    });

    // Add extension request
    booking.extensionRequests.push({
      requestedAt: new Date(),
      newReturnDate: newReturn,
      additionalHours: duration.hours,
      additionalAmount: additionalPricing.pricing.totalAmount,
      status: "pending",
      reason,
    });

    await booking.save();

    res.json({
      success: true,
      message: "Extension request submitted",
      additionalCharges: additionalPricing.pricing.totalAmount,
      duration: duration,
    });
  } catch (err) {
    console.error("Error requesting extension:", err);
    res.status(500).json({
      success: false,
      message: "Failed to request extension",
    });
  }
};

/**
 * @desc    Cancel booking
 * @route   POST /api/bookings/:id/cancel
 * @access  Public
 */
export const cancelBooking = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { reason, cancelledBy = "driver" } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this booking",
      });
    }

    // Calculate cancellation fee
    const cancellationFee = calculateCancellationFee(
      booking.scheduledPickupDate,
      booking.pricing.totalAmount
    );

    booking.cancellationFee = cancellationFee;
    booking.cancellationReason = reason;
    await booking.updateStatus("cancelled", cancelledBy, reason);

    // Mark vehicle as available
    const vehicle = await Vehicle.findOne({ vehicleId: booking.vehicleId });
    if (vehicle) {
      vehicle.isAvailable = true;
      vehicle.currentBookingId = null;
      await vehicle.save();
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      cancellationFee,
      refundAmount: booking.pricing.totalAmount - cancellationFee,
    });
  } catch (err) {
    console.error("Error cancelling booking:", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  }
};

/**
 * @desc    Submit booking rating
 * @route   POST /api/bookings/:id/rate
 * @access  Public
 */
export const rateBooking = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const {
      overall,
      vehicleCondition,
      cleanliness,
      service,
      value,
      feedback,
      photos,
    } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only rate completed bookings",
      });
    }

    booking.driverRating = {
      overall,
      vehicleCondition,
      cleanliness,
      service,
      value,
      feedback,
      photos: photos || [],
      ratedAt: new Date(),
    };

    await booking.save();

    res.json({
      success: true,
      message: "Rating submitted successfully",
    });
  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({
      success: false,
      message: "Failed to submit rating",
    });
  }
};

/**
 * @desc    Get booking statistics
 * @route   GET /api/bookings/stats/overview
 * @access  Public
 */
export const getBookingStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
    }

    const [
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      categoryStats,
    ] = await Promise.all([
      Booking.countDocuments(dateFilter),
      Booking.countDocuments({
        status: { $in: ["confirmed", "vehicle_ready", "active", "extended"] },
      }),
      Booking.countDocuments({ ...dateFilter, status: "completed" }),
      Booking.countDocuments({ ...dateFilter, status: "cancelled" }),
      Booking.aggregate([
        { $match: { ...dateFilter, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
      ]),
      Booking.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$vehicleCategory",
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "completed"] },
                  "$pricing.totalAmount",
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        categoryStats: categoryStats.map((cat) => ({
          category: cat._id,
          bookings: cat.count,
          revenue: cat.revenue,
        })),
      },
    });
  } catch (err) {
    console.error("Error fetching booking stats:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking statistics",
    });
  }
};
