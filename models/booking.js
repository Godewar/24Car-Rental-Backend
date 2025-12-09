import mongoose from "mongoose";

// Counter for booking IDs
const getNextBookingId = async () => {
  const Counter = mongoose.model("Counter");
  const counter = await Counter.findByIdAndUpdate(
    "bookingId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

const BookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: Number,
      unique: true,
    },

    // ============ DRIVER INFO ============
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    driverName: {
      type: String,
      required: true,
    },
    driverPhone: {
      type: String,
      required: true,
    },
    driverEmail: String,
    driverAge: Number,

    // Driver documents (required for rental)
    drivingLicense: {
      number: String,
      expiryDate: Date,
      issueDate: Date,
      verified: {
        type: Boolean,
        default: false,
      },
      photoUrl: String,
      verifiedBy: String,
      verifiedAt: Date,
    },
    aadharCard: {
      number: String,
      verified: {
        type: Boolean,
        default: false,
      },
      photoUrl: String,
    },

    // ============ VEHICLE DETAILS ============
    vehicleId: {
      type: Number,
      required: true,
      ref: "Vehicle",
    },
    vehicleCategory: {
      type: String,
      enum: ["Car", "Bike", "Scooty"],
      required: true,
    },
    vehicleName: String,
    registrationNumber: String,
    brand: String,
    model: String,
    fuelType: String,
    transmissionType: String, // Automatic/Manual

    // ============ RENTAL PACKAGE & PRICING ============
    rentalPackage: {
      type: String,
      enum: ["hourly", "daily", "weekly", "monthly", "custom"],
      required: true,
      default: "daily",
    },

    // Rental duration
    duration: {
      hours: Number,
      days: Number,
      weeks: Number,
    },

    // Pricing breakdown
    pricing: {
      baseRate: {
        type: Number,
        required: true,
      },
      rateType: {
        type: String,
        enum: ["per_hour", "per_day", "per_week", "per_month"],
      },

      // KM package
      includedKm: {
        type: Number,
        default: 0,
      },
      extraKmRate: {
        type: Number,
        default: 0,
      },
      actualKmDriven: Number,
      extraKmCharges: {
        type: Number,
        default: 0,
      },

      // Fuel policy
      fuelPolicy: {
        type: String,
        enum: ["full-to-full", "prepaid", "included"],
        default: "full-to-full",
      },
      fuelCharges: {
        type: Number,
        default: 0,
      },

      // Insurance & extras
      insuranceType: {
        type: String,
        enum: ["basic", "comprehensive", "zero-deductible"],
        default: "basic",
      },
      insuranceCharges: Number,

      // Additional services
      gps: {
        type: Boolean,
        default: false,
      },
      childSeat: {
        type: Boolean,
        default: false,
      },
      additionalDriver: {
        type: Boolean,
        default: false,
      },
      extrasCharges: {
        type: Number,
        default: 0,
      },

      // Security deposit
      securityDeposit: {
        type: Number,
        required: true,
        default: 0,
      },
      depositRefunded: {
        type: Boolean,
        default: false,
      },
      depositDeductions: {
        type: Number,
        default: 0,
      },
      deductionReason: String,

      // Taxes and fees
      gst: Number,
      platformFee: Number,
      tollCharges: {
        type: Number,
        default: 0,
      },
      parkingCharges: {
        type: Number,
        default: 0,
      },
      cleaningCharges: {
        type: Number,
        default: 0,
      },

      // Discount
      discount: {
        type: Number,
        default: 0,
      },
      promoCode: String,

      // Total amounts
      subtotal: Number,
      totalAmount: {
        type: Number,
        required: true,
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      pendingAmount: Number,
    },

    // ============ PICKUP & RETURN LOCATIONS ============
    pickupStation: {
      stationId: String,
      stationName: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
      contactNumber: String,
    },

    returnStation: {
      stationId: String,
      stationName: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
      contactNumber: String,
    },

    differentReturnLocation: {
      type: Boolean,
      default: false,
    },

    // ============ BOOKING TIME DETAILS ============
    scheduledPickupDate: {
      type: Date,
      required: true,
    },
    scheduledReturnDate: {
      type: Date,
      required: true,
    },

    actualPickupDate: Date,
    actualReturnDate: Date,

    isLateReturn: {
      type: Boolean,
      default: false,
    },
    lateReturnCharges: {
      type: Number,
      default: 0,
    },

    // ============ VEHICLE CONDITION ============
    pickupCondition: {
      fuelLevel: String, // e.g., "75%", "Full"
      odometerReading: Number,
      photos: [String], // URLs
      damages: [
        {
          type: String,
          description: String,
          photoUrl: String,
          severity: {
            type: String,
            enum: ["minor", "moderate", "major"],
          },
        },
      ],
      checkedBy: String,
      checkedAt: Date,
      notes: String,
    },

    returnCondition: {
      fuelLevel: String,
      odometerReading: Number,
      photos: [String],
      damages: [
        {
          type: String,
          description: String,
          photoUrl: String,
          severity: {
            type: String,
            enum: ["minor", "moderate", "major"],
          },
          repairCost: Number,
        },
      ],
      checkedBy: String,
      checkedAt: Date,
      notes: String,
    },

    // ============ BOOKING STATUS ============
    status: {
      type: String,
      enum: [
        "pending_verification", // Documents submitted, pending verification
        "confirmed", // Booking confirmed, payment received
        "vehicle_ready", // Vehicle prepared for pickup
        "active", // Driver has picked up vehicle
        "extended", // Rental period extended
        "completed", // Vehicle returned successfully
        "cancelled", // Booking cancelled
        "no_show", // Driver didn't show up
        "suspended", // Suspended due to violation
      ],
      default: "pending_verification",
    },

    // ============ PAYMENT DETAILS ============
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cash"],
      default: "card",
    },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "partial",
        "paid",
        "refund_pending",
        "refunded",
        "failed",
      ],
      default: "pending",
    },
    paymentTransactions: [
      {
        transactionId: String,
        amount: Number,
        type: {
          type: String,
          enum: [
            "booking",
            "security_deposit",
            "extension",
            "extra_charges",
            "refund",
          ],
        },
        method: String,
        status: String,
        gateway: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ============ CANCELLATION ============
    cancellationDetails: {
      reason: String,
      cancelledBy: String, // 'driver', 'admin', 'system'
      cancelledAt: Date,
      refundAmount: Number,
      cancellationFee: Number,
      refundStatus: {
        type: String,
        enum: ["pending", "processed", "completed"],
      },
    },

    // ============ EXTENSION ============
    extensionRequests: [
      {
        requestedAt: Date,
        newReturnDate: Date,
        additionalHours: Number,
        additionalAmount: Number,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
        },
        approvedBy: String,
        approvedAt: Date,
      },
    ],

    // ============ RATING & FEEDBACK ============
    driverRating: {
      overall: Number,
      vehicleCondition: Number,
      cleanliness: Number,
      service: Number,
      value: Number,
      feedback: String,
      photos: [String],
      ratedAt: Date,
    },

    // ============ VIOLATIONS & PENALTIES ============
    violations: [
      {
        type: {
          type: String,
          enum: [
            "speeding",
            "parking",
            "toll",
            "traffic",
            "damage",
            "smoking",
            "other",
          ],
        },
        description: String,
        penalty: Number,
        date: Date,
        status: {
          type: String,
          enum: ["pending", "paid", "disputed", "waived"],
        },
        photoUrl: String,
      },
    ],

    // ============ ADDITIONAL INFO ============
    purposeOfTrip: String,
    specialRequests: String,
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },

    // ============ ADMIN NOTES ============
    adminNotes: [
      {
        note: String,
        addedBy: String,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ============ STATUS HISTORY ============
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: String,
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
BookingSchema.index({ bookingId: 1 });
BookingSchema.index({ vehicleId: 1, status: 1 });
BookingSchema.index({ driverId: 1 });
BookingSchema.index({ driverPhone: 1 });
BookingSchema.index({ status: 1, scheduledPickupDate: 1 });
BookingSchema.index({ scheduledPickupDate: 1, scheduledReturnDate: 1 });

// Pre-save middleware to generate bookingId
BookingSchema.pre("save", async function (next) {
  if (this.isNew && !this.bookingId) {
    this.bookingId = await getNextBookingId();
  }

  // Add to status history
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: "system",
    });
  }

  // Calculate pending amount
  if (this.pricing) {
    this.pricing.pendingAmount =
      (this.pricing.totalAmount || 0) - (this.pricing.paidAmount || 0);
  }

  next();
});

// Methods
BookingSchema.methods.updateStatus = function (
  newStatus,
  updatedBy = "system",
  notes = ""
) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy,
    notes,
  });
  return this.save();
};

BookingSchema.methods.calculateTotalAmount = function () {
  if (!this.pricing) return 0;

  const p = this.pricing;
  const subtotal =
    (p.baseRate || 0) +
    (p.extraKmCharges || 0) +
    (p.fuelCharges || 0) +
    (p.insuranceCharges || 0) +
    (p.extrasCharges || 0) +
    (p.tollCharges || 0) +
    (p.parkingCharges || 0) +
    (p.cleaningCharges || 0) +
    (this.lateReturnCharges || 0);

  p.subtotal = subtotal;
  p.gst = p.gst || subtotal * 0.05; // 5% GST
  p.totalAmount =
    subtotal + (p.gst || 0) + (p.platformFee || 0) - (p.discount || 0);

  return p.totalAmount;
};

// Static methods
BookingSchema.statics.findActiveBookingForVehicle = async function (
  vehicleId,
  excludeBookingId = null
) {
  const query = {
    vehicleId,
    status: { $in: ["confirmed", "vehicle_ready", "active", "extended"] },
  };

  if (excludeBookingId) {
    query.bookingId = { $ne: excludeBookingId };
  }

  return this.findOne(query);
};

BookingSchema.statics.checkVehicleAvailability = async function (
  vehicleId,
  startDate,
  endDate
) {
  const overlappingBookings = await this.find({
    vehicleId,
    status: { $in: ["confirmed", "vehicle_ready", "active", "extended"] },
    $or: [
      // Requested period starts during existing booking
      {
        scheduledPickupDate: { $lte: startDate },
        scheduledReturnDate: { $gte: startDate },
      },
      // Requested period ends during existing booking
      {
        scheduledPickupDate: { $lte: endDate },
        scheduledReturnDate: { $gte: endDate },
      },
      // Requested period completely contains existing booking
      {
        scheduledPickupDate: { $gte: startDate },
        scheduledReturnDate: { $lte: endDate },
      },
    ],
  });

  return overlappingBookings.length === 0;
};

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
export default Booking;
