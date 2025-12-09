// Fare calculation utilities for ride-hailing service

// Base fares per category (in rupees)
const BASE_FARES = {
  Bike: 30,
  Scooty: 25,
  Car: 50,
};

// Per km charges
const PER_KM_RATES = {
  Bike: 8,
  Scooty: 7,
  Car: 12,
};

// Per minute charges (for time-based pricing)
const PER_MINUTE_RATES = {
  Bike: 1.5,
  Scooty: 1.2,
  Car: 2,
};

// Minimum fare
const MINIMUM_FARES = {
  Bike: 40,
  Scooty: 35,
  Car: 70,
};

// Platform fee (fixed)
const PLATFORM_FEE = 5;

// GST percentage
const GST_RATE = 0.05; // 5%

// Surge pricing thresholds (based on demand)
const SURGE_MULTIPLIERS = {
  low: 1.0,
  medium: 1.2,
  high: 1.5,
  very_high: 2.0,
  peak: 2.5,
};

// Peak hours configuration
const PEAK_HOURS = [
  { start: 8, end: 10 }, // Morning rush
  { start: 17, end: 20 }, // Evening rush
];

// Weekend multiplier
const WEEKEND_MULTIPLIER = 1.1;

/**
 * Calculate Haversine distance between two coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate journey duration based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} category - Vehicle category
 * @returns {number} Estimated duration in minutes
 */
export function estimateDuration(distanceKm, category = "Car") {
  // Average speeds (km/h) considering city traffic
  const avgSpeeds = {
    Bike: 25,
    Scooty: 20,
    Car: 30,
  };

  const speed = avgSpeeds[category] || avgSpeeds.Car;
  const hours = distanceKm / speed;
  const minutes = Math.ceil(hours * 60);

  // Add buffer time for traffic (20%)
  return Math.ceil(minutes * 1.2);
}

/**
 * Check if current time is peak hour
 * @param {Date} date - Date to check (defaults to now)
 * @returns {boolean}
 */
export function isPeakHour(date = new Date()) {
  const hour = date.getHours();
  return PEAK_HOURS.some((peak) => hour >= peak.start && hour < peak.end);
}

/**
 * Check if current day is weekend
 * @param {Date} date - Date to check (defaults to now)
 * @returns {boolean}
 */
export function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Calculate surge multiplier based on demand and time
 * @param {string} demandLevel - 'low', 'medium', 'high', 'very_high', 'peak'
 * @param {Date} date - Current date/time
 * @returns {number}
 */
export function calculateSurgeMultiplier(
  demandLevel = "low",
  date = new Date()
) {
  let multiplier = SURGE_MULTIPLIERS[demandLevel] || 1.0;

  // Apply peak hour surge
  if (isPeakHour(date)) {
    multiplier = Math.max(multiplier, SURGE_MULTIPLIERS.high);
  }

  // Apply weekend multiplier
  if (isWeekend(date)) {
    multiplier *= WEEKEND_MULTIPLIER;
  }

  return Math.round(multiplier * 100) / 100;
}

/**
 * Calculate detailed fare breakdown
 * @param {Object} params - Fare calculation parameters
 * @param {string} params.category - Vehicle category (Bike, Scooty, Car)
 * @param {number} params.distance - Distance in kilometers
 * @param {number} params.duration - Duration in minutes (optional)
 * @param {string} params.demandLevel - Demand level for surge pricing
 * @param {Date} params.bookingTime - Booking time
 * @param {number} params.discount - Discount amount
 * @param {string} params.promoCode - Promo code applied
 * @returns {Object} Fare breakdown
 */
export function calculateFare({
  category = "Car",
  distance,
  duration = null,
  demandLevel = "low",
  bookingTime = new Date(),
  discount = 0,
  promoCode = null,
}) {
  // Validate category
  if (!BASE_FARES[category]) {
    throw new Error(`Invalid vehicle category: ${category}`);
  }

  // Calculate estimated duration if not provided
  if (!duration) {
    duration = estimateDuration(distance, category);
  }

  // Base fare
  const baseFare = BASE_FARES[category];

  // Distance-based fare
  const distanceFare = distance * PER_KM_RATES[category];

  // Time-based fare
  const timeFare = duration * PER_MINUTE_RATES[category];

  // Subtotal before surge
  let subtotal = baseFare + distanceFare + timeFare;

  // Apply minimum fare
  const minimumFare = MINIMUM_FARES[category];
  if (subtotal < minimumFare) {
    subtotal = minimumFare;
  }

  // Calculate surge
  const surgeMultiplier = calculateSurgeMultiplier(demandLevel, bookingTime);
  const surgeFare =
    surgeMultiplier > 1.0 ? subtotal * (surgeMultiplier - 1.0) : 0;

  // Platform fee
  const platformFee = PLATFORM_FEE;

  // Total before tax
  const totalBeforeTax = subtotal + surgeFare + platformFee;

  // GST
  const gst = totalBeforeTax * GST_RATE;

  // Total fare
  let totalFare = totalBeforeTax + gst;

  // Apply discount
  const finalDiscount = Math.min(discount, totalFare);
  totalFare -= finalDiscount;

  // Round to 2 decimal places
  const roundedFare = Math.round(totalFare * 100) / 100;

  return {
    category,
    distance: Math.round(distance * 100) / 100,
    estimatedDuration: duration,
    baseFare: Math.round(baseFare * 100) / 100,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    surgeMultiplier,
    surgeFare: Math.round(surgeFare * 100) / 100,
    platformFee,
    totalBeforeTax: Math.round(totalBeforeTax * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    discount: finalDiscount,
    promoCode: promoCode || null,
    totalFare: roundedFare,
    breakdown: {
      base: `₹${baseFare}`,
      distance: `₹${Math.round(distanceFare * 100) / 100} (${distance} km × ₹${
        PER_KM_RATES[category]
      }/km)`,
      time: `₹${Math.round(timeFare * 100) / 100} (${duration} min × ₹${
        PER_MINUTE_RATES[category]
      }/min)`,
      surge:
        surgeMultiplier > 1.0
          ? `₹${Math.round(surgeFare * 100) / 100} (${surgeMultiplier}x surge)`
          : "No surge",
      platform: `₹${platformFee}`,
      tax: `₹${Math.round(gst * 100) / 100} (${GST_RATE * 100}% GST)`,
      discount: finalDiscount > 0 ? `-₹${finalDiscount}` : "No discount",
    },
  };
}

/**
 * Get fare estimates for all vehicle categories
 * @param {number} pickupLat - Pickup latitude
 * @param {number} pickupLon - Pickup longitude
 * @param {number} dropoffLat - Dropoff latitude
 * @param {number} dropoffLon - Dropoff longitude
 * @param {string} demandLevel - Current demand level
 * @param {Date} bookingTime - Booking time
 * @returns {Array} Array of fare estimates for each category
 */
export function getFareEstimates(
  pickupLat,
  pickupLon,
  dropoffLat,
  dropoffLon,
  demandLevel = "low",
  bookingTime = new Date()
) {
  const distance = calculateDistance(
    pickupLat,
    pickupLon,
    dropoffLat,
    dropoffLon
  );

  if (distance < 0.5) {
    throw new Error("Distance too short. Minimum distance is 0.5 km");
  }

  const categories = ["Bike", "Scooty", "Car"];

  return categories.map((category) => {
    const fare = calculateFare({
      category,
      distance,
      demandLevel,
      bookingTime,
    });

    return {
      category,
      ...fare,
    };
  });
}

/**
 * Calculate cancellation charge based on booking status
 * @param {string} status - Current booking status
 * @param {number} totalFare - Total booking fare
 * @returns {number} Cancellation charge
 */
export function calculateCancellationCharge(status, totalFare) {
  const charges = {
    pending: 0, // No charge
    confirmed: totalFare * 0.1, // 10% of fare
    driver_assigned: totalFare * 0.2, // 20% of fare
    driver_arrived: totalFare * 0.5, // 50% of fare
    started: totalFare, // Full fare
  };

  return Math.round((charges[status] || 0) * 100) / 100;
}

export default {
  calculateDistance,
  estimateDuration,
  calculateFare,
  getFareEstimates,
  calculateSurgeMultiplier,
  calculateCancellationCharge,
  isPeakHour,
  isWeekend,
};
