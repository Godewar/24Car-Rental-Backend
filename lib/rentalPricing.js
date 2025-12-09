// Rental pricing calculator for ZoomCar-style car rental service

// ============ RENTAL RATES (Per Vehicle Category) ============

const RENTAL_RATES = {
  Car: {
    hourly: {
      min: 4, // Minimum 4 hours
      rate: 150, // ₹150 per hour
      includedKm: 40, // 10 km per hour
      extraKmRate: 8,
    },
    daily: {
      rate: 2500, // ₹2500 per day
      includedKm: 200, // 200 km per day
      extraKmRate: 8,
    },
    weekly: {
      rate: 15000, // ₹15000 per week
      includedKm: 1400, // 200 km per day
      extraKmRate: 7,
    },
    monthly: {
      rate: 45000, // ₹45000 per month
      includedKm: 6000, // 200 km per day
      extraKmRate: 6,
    },
  },
  Bike: {
    hourly: {
      min: 4,
      rate: 80,
      includedKm: 40,
      extraKmRate: 5,
    },
    daily: {
      rate: 800,
      includedKm: 150,
      extraKmRate: 5,
    },
    weekly: {
      rate: 4500,
      includedKm: 1050,
      extraKmRate: 4,
    },
    monthly: {
      rate: 12000,
      includedKm: 4500,
      extraKmRate: 3,
    },
  },
  Scooty: {
    hourly: {
      min: 4,
      rate: 60,
      includedKm: 40,
      extraKmRate: 4,
    },
    daily: {
      rate: 600,
      includedKm: 120,
      extraKmRate: 4,
    },
    weekly: {
      rate: 3500,
      includedKm: 840,
      extraKmRate: 3,
    },
    monthly: {
      rate: 9000,
      includedKm: 3600,
      extraKmRate: 2,
    },
  },
};

// ============ INSURANCE OPTIONS ============

const INSURANCE_RATES = {
  Car: {
    basic: 0, // Included in base price
    comprehensive: 500, // Per booking
    "zero-deductible": 1000, // Per booking
  },
  Bike: {
    basic: 0,
    comprehensive: 200,
    "zero-deductible": 400,
  },
  Scooty: {
    basic: 0,
    comprehensive: 150,
    "zero-deductible": 300,
  },
};

// ============ SECURITY DEPOSIT ============

const SECURITY_DEPOSIT = {
  Car: 5000,
  Bike: 2000,
  Scooty: 1500,
};

// ============ ADDITIONAL SERVICES ============

const EXTRAS = {
  gps: 100, // Per booking
  childSeat: 200, // Per booking
  additionalDriver: 500, // Per booking
};

// ============ PLATFORM FEE & TAX ============

const PLATFORM_FEE = 100; // Fixed per booking
const GST_RATE = 0.05; // 5%

// ============ CANCELLATION FEES ============

const CANCELLATION_FEES = {
  // Based on hours before pickup
  moreThan72Hours: 0, // 0% - Full refund
  between48And72Hours: 0.25, // 25% of booking amount
  between24And48Hours: 0.5, // 50% of booking amount
  lessThan24Hours: 0.75, // 75% of booking amount
  afterPickup: 1.0, // 100% - No refund
};

// ============ LATE RETURN CHARGES ============

const LATE_RETURN_CHARGES = {
  Car: {
    perHour: 200,
    perDay: 3000, // If more than 6 hours late
  },
  Bike: {
    perHour: 100,
    perDay: 1200,
  },
  Scooty: {
    perHour: 80,
    perDay: 900,
  },
};

/**
 * Calculate rental duration in hours and days
 * @param {Date} pickupDate
 * @param {Date} returnDate
 * @returns {Object} {hours, days, weeks}
 */
export function calculateDuration(pickupDate, returnDate) {
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);

  const diffMs = returnD - pickup;
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  return {
    hours: diffHours,
    days: diffDays,
    weeks: diffWeeks,
    milliseconds: diffMs,
  };
}

/**
 * Calculate rental pricing based on duration and category
 * @param {Object} params
 * @param {string} params.category - Vehicle category (Car/Bike/Scooty)
 * @param {Date} params.pickupDate - Pickup date
 * @param {Date} params.returnDate - Return date
 * @param {string} params.insuranceType - Insurance type
 * @param {Object} params.extras - Additional services {gps, childSeat, additionalDriver}
 * @param {number} params.discount - Discount amount
 * @param {string} params.promoCode - Promo code
 * @returns {Object} Pricing breakdown
 */
export function calculateRentalPrice({
  category = "Car",
  pickupDate,
  returnDate,
  insuranceType = "basic",
  extras = {},
  discount = 0,
  promoCode = null,
}) {
  // Validate category
  if (!RENTAL_RATES[category]) {
    throw new Error(`Invalid vehicle category: ${category}`);
  }

  // Calculate duration
  const duration = calculateDuration(pickupDate, returnDate);

  // Determine best package
  let rentalPackage, baseRate, includedKm, extraKmRate, rateType;

  if (duration.days >= 30) {
    // Monthly package
    rentalPackage = "monthly";
    const months = Math.ceil(duration.days / 30);
    baseRate = RENTAL_RATES[category].monthly.rate * months;
    includedKm = RENTAL_RATES[category].monthly.includedKm * months;
    extraKmRate = RENTAL_RATES[category].monthly.extraKmRate;
    rateType = "per_month";
  } else if (duration.days >= 7) {
    // Weekly package
    rentalPackage = "weekly";
    const weeks = Math.ceil(duration.days / 7);
    baseRate = RENTAL_RATES[category].weekly.rate * weeks;
    includedKm = RENTAL_RATES[category].weekly.includedKm * weeks;
    extraKmRate = RENTAL_RATES[category].weekly.extraKmRate;
    rateType = "per_week";
  } else if (duration.days >= 1) {
    // Daily package
    rentalPackage = "daily";
    baseRate = RENTAL_RATES[category].daily.rate * duration.days;
    includedKm = RENTAL_RATES[category].daily.includedKm * duration.days;
    extraKmRate = RENTAL_RATES[category].daily.extraKmRate;
    rateType = "per_day";
  } else {
    // Hourly package
    rentalPackage = "hourly";
    const minHours = RENTAL_RATES[category].hourly.min;
    const billableHours = Math.max(duration.hours, minHours);
    baseRate = RENTAL_RATES[category].hourly.rate * billableHours;
    includedKm = RENTAL_RATES[category].hourly.includedKm * billableHours;
    extraKmRate = RENTAL_RATES[category].hourly.extraKmRate;
    rateType = "per_hour";
  }

  // Insurance charges
  const insuranceCharges = INSURANCE_RATES[category][insuranceType] || 0;

  // Security deposit
  const securityDeposit = SECURITY_DEPOSIT[category];

  // Extra services
  let extrasCharges = 0;
  if (extras.gps) extrasCharges += EXTRAS.gps;
  if (extras.childSeat) extrasCharges += EXTRAS.childSeat;
  if (extras.additionalDriver) extrasCharges += EXTRAS.additionalDriver;

  // Subtotal
  const subtotal = baseRate + insuranceCharges + extrasCharges;

  // Platform fee and GST
  const platformFee = PLATFORM_FEE;
  const gst = subtotal * GST_RATE;

  // Total amount
  let totalAmount = subtotal + platformFee + gst - discount;

  // Round to 2 decimal places
  totalAmount = Math.round(totalAmount * 100) / 100;

  return {
    category,
    rentalPackage,
    duration: {
      hours: duration.hours,
      days: duration.days,
      weeks: duration.weeks,
    },
    pricing: {
      baseRate: Math.round(baseRate * 100) / 100,
      rateType,
      includedKm,
      extraKmRate,
      insuranceType,
      insuranceCharges,
      extrasCharges,
      securityDeposit,
      subtotal: Math.round(subtotal * 100) / 100,
      platformFee,
      gst: Math.round(gst * 100) / 100,
      discount,
      promoCode,
      totalAmount,
    },
    breakdown: {
      baseRental: `₹${
        Math.round(baseRate * 100) / 100
      } (${rentalPackage} package)`,
      includedKm: `${includedKm} km included`,
      extraKm: `₹${extraKmRate}/km after ${includedKm} km`,
      insurance: `₹${insuranceCharges} (${insuranceType})`,
      extras: extrasCharges > 0 ? `₹${extrasCharges}` : "None",
      platformFee: `₹${platformFee}`,
      gst: `₹${Math.round(gst * 100) / 100} (5% GST)`,
      discount: discount > 0 ? `-₹${discount}` : "No discount",
      securityDeposit: `₹${securityDeposit} (refundable)`,
    },
  };
}

/**
 * Calculate extra KM charges
 * @param {number} includedKm
 * @param {number} actualKm
 * @param {number} ratePerKm
 * @returns {number}
 */
export function calculateExtraKmCharges(includedKm, actualKm, ratePerKm) {
  if (actualKm <= includedKm) return 0;
  const extraKm = actualKm - includedKm;
  return Math.round(extraKm * ratePerKm * 100) / 100;
}

/**
 * Calculate late return charges
 * @param {Date} scheduledReturn
 * @param {Date} actualReturn
 * @param {string} category
 * @returns {Object}
 */
export function calculateLateReturnCharges(
  scheduledReturn,
  actualReturn,
  category
) {
  const scheduled = new Date(scheduledReturn);
  const actual = new Date(actualReturn);

  if (actual <= scheduled) {
    return { isLate: false, charges: 0, lateBy: { hours: 0, days: 0 } };
  }

  const diffMs = actual - scheduled;
  const lateHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const lateDays = Math.floor(lateHours / 24);

  const rates = LATE_RETURN_CHARGES[category] || LATE_RETURN_CHARGES.Car;

  let charges;
  if (lateDays > 0) {
    // Charge per day if more than 6 hours late
    charges = lateDays * rates.perDay;
    if (lateHours % 24 > 0) {
      charges += rates.perHour;
    }
  } else {
    // Charge per hour
    charges = lateHours * rates.perHour;
  }

  return {
    isLate: true,
    charges: Math.round(charges * 100) / 100,
    lateBy: {
      hours: lateHours,
      days: lateDays,
    },
  };
}

/**
 * Calculate cancellation fee
 * @param {Date} pickupDate
 * @param {Date} cancellationDate
 * @param {number} totalAmount
 * @returns {Object}
 */
export function calculateCancellationFee(
  pickupDate,
  cancellationDate,
  totalAmount
) {
  const pickup = new Date(pickupDate);
  const cancellation = new Date(cancellationDate);

  const diffMs = pickup - cancellation;
  const hoursBeforePickup = diffMs / (1000 * 60 * 60);

  let feePercentage;
  let refundAmount;

  if (hoursBeforePickup >= 72) {
    feePercentage = CANCELLATION_FEES.moreThan72Hours;
  } else if (hoursBeforePickup >= 48) {
    feePercentage = CANCELLATION_FEES.between48And72Hours;
  } else if (hoursBeforePickup >= 24) {
    feePercentage = CANCELLATION_FEES.between24And48Hours;
  } else if (hoursBeforePickup > 0) {
    feePercentage = CANCELLATION_FEES.lessThan24Hours;
  } else {
    feePercentage = CANCELLATION_FEES.afterPickup;
  }

  const cancellationFee = Math.round(totalAmount * feePercentage * 100) / 100;
  refundAmount = totalAmount - cancellationFee;

  return {
    hoursBeforePickup: Math.round(hoursBeforePickup * 100) / 100,
    cancellationFee,
    refundAmount,
    refundPercentage: Math.round((1 - feePercentage) * 100),
  };
}

/**
 * Get rental packages for all categories
 * @param {Date} pickupDate
 * @param {Date} returnDate
 * @returns {Array}
 */
export function getAllRentalPackages(pickupDate, returnDate) {
  const categories = ["Car", "Bike", "Scooty"];

  return categories.map((category) => {
    const estimate = calculateRentalPrice({
      category,
      pickupDate,
      returnDate,
      insuranceType: "basic",
      extras: {},
    });

    return {
      category,
      ...estimate,
    };
  });
}

/**
 * Check if vehicle is available for given time period
 * @param {Array} existingBookings
 * @param {Date} requestedPickup
 * @param {Date} requestedReturn
 * @returns {boolean}
 */
export function checkAvailability(
  existingBookings,
  requestedPickup,
  requestedReturn
) {
  const pickup = new Date(requestedPickup);
  const returnD = new Date(requestedReturn);

  for (const booking of existingBookings) {
    const bookingPickup = new Date(booking.scheduledPickupDate);
    const bookingReturn = new Date(booking.scheduledReturnDate);

    // Check for overlap
    if (
      (pickup >= bookingPickup && pickup < bookingReturn) ||
      (returnD > bookingPickup && returnD <= bookingReturn) ||
      (pickup <= bookingPickup && returnD >= bookingReturn)
    ) {
      return false;
    }
  }

  return true;
}

export default {
  calculateDuration,
  calculateRentalPrice,
  calculateExtraKmCharges,
  calculateLateReturnCharges,
  calculateCancellationFee,
  getAllRentalPackages,
  checkAvailability,
  RENTAL_RATES,
  INSURANCE_RATES,
  SECURITY_DEPOSIT,
  EXTRAS,
};
