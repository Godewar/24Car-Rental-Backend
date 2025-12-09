import mongoose from "mongoose";

// Counter schema for auto-incrementing vehicleId
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

// Function to get the next sequence value
async function getNextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

const VehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: Number,
      unique: true,
      required: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    // Core details
    model: String,
    brand: String,
    category: {
      type: String,
      enum: ["Car", "Bike", "Scooty"],
      required: true,
    },
    vehicleName: String,
    ownerName: String,
    ownerPhone: String,
    year: Number,
    registrationDate: String,
    rcExpiryDate: String,
    roadTaxDate: String,
    roadTaxNumber: String,
    insuranceDate: String,
    permitDate: String,
    emissionDate: String,
    pucNumber: String,
    trafficFine: Number,
    trafficFineDate: String,
    fuelType: String,
    assignedDriver: String,
    assignedManager: {
      type: String,
      default: "",
    },

    // Location data for nearby vehicle search
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
      address: String,
      city: String,
      state: String,
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Service area (where vehicle is available)
    serviceArea: {
      type: String, // City or region name
      default: "",
    },

    // Availability status for booking
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Current booking reference
    currentBookingId: {
      type: Number,
      ref: "Booking",
      default: null,
    },

    rentStartDate: Date,
    rentPausedDate: Date,
    kycStatus: {
      type: String,
      enum: ["active", "inactive", "pending", "verified", "rejected"],
      default: "pending",
    },
    kycActivatedDate: {
      type: Date,
    },
    kycVerifiedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "inactive",
    },
    remarks: String,

    // Documents
    insuranceDoc: String,
    rcDoc: String,
    permitDoc: String,
    pollutionDoc: String,
    fitnessDoc: String,

    // New photo URL fields (uploaded to Cloudinary)
    registrationCardPhoto: String,
    roadTaxPhoto: String,
    pucPhoto: String,
    permitPhoto: String,
    carFrontPhoto: String,
    carLeftPhoto: String,
    carRightPhoto: String,
    carBackPhoto: String,
    carFullPhoto: String,

    // Additional fields
    make: String,
    color: String,
    purchaseDate: String,
    purchasePrice: Number,
    currentValue: Number,
    mileage: Number,
    lastService: String,
    nextService: String,

    // Dynamic rent slabs
    weeklyRentSlabs: [
      {
        trips: Number,
        rentDay: Number,
        weeklyRent: Number,
        accidentalCover: Number,
        acceptanceRate: Number,
      },
    ],
    dailyRentSlabs: [
      {
        trips: Number,
        rentDay: Number,
        weeklyRent: Number,
        accidentalCover: Number,
        acceptanceRate: Number,
      },
    ],
    monthlyProfitMin: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strict: false, // Allow additional fields
  }
);

// Geospatial index for location-based queries
VehicleSchema.index({ "currentLocation.coordinates": "2dsphere" });
VehicleSchema.index({ category: 1, isAvailable: 1, status: 1 });
VehicleSchema.index({ serviceArea: 1, category: 1 });

// Add getNextSequence as a static method
VehicleSchema.statics.getNextSequence = getNextSequence;

// Static method to find nearby available vehicles
VehicleSchema.statics.findNearby = async function (
  longitude,
  latitude,
  maxDistance = 5000,
  category = null
) {
  const query = {
    status: "active",
    isAvailable: true,
    "currentLocation.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance, // in meters
      },
    },
  };

  if (category) {
    query.category = category;
  }

  return this.find(query).limit(20);
};

const Vehicle =
  mongoose.models.Vehicle || mongoose.model("Vehicle", VehicleSchema);
export default Vehicle;
