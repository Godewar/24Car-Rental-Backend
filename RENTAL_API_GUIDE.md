# 🚗 ZoomCar-Style Rental API Guide

## Overview

This is a **self-drive vehicle rental backend** (like ZoomCar, not ride-hailing like Ola/Uber). Key features include:

- ⏱️ **Time-based pricing** (hourly/daily/weekly/monthly packages)
- 🛣️ **KM allowance** with overage charges
- 📄 **Document verification** (driving license, Aadhar)
- 🔒 **Security deposits** with refund management
- 🚦 **Vehicle condition tracking** (fuel, odometer, damages)
- 📍 **Pickup/return stations** (not dynamic location tracking)
- ⏰ **Late return penalties** and **cancellation fees**
- ⭐ **Customer ratings** and reviews

---

## 🚀 API Endpoints

### 1. Estimate Rental Price

Get pricing for all vehicle categories or a specific one for given dates.

```bash
POST /api/bookings/estimate-price
Content-Type: application/json

{
  "pickupDate": "2025-12-25T10:00:00Z",
  "returnDate": "2025-12-28T10:00:00Z",
  "category": "Car",  // Optional: "Car" | "Bike" | "Scooty"
  "insuranceType": "comprehensive",  // Optional: "basic" | "comprehensive" | "zero-deductible"
  "extras": {  // Optional
    "gps": true,
    "childSeat": true,
    "additionalDriver": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "estimate": {
    "category": "Car",
    "rentalPackage": "daily",
    "duration": {
      "hours": 72,
      "days": 3,
      "weeks": 0
    },
    "pricing": {
      "baseRate": 7500,
      "rateType": "per_day",
      "includedKm": 600,
      "extraKmRate": 8,
      "insuranceCharges": 500,
      "extrasCharges": 100,
      "securityDeposit": 5000,
      "totalAmount": 8605
    },
    "breakdown": {
      "baseRental": "₹7500 (daily package)",
      "includedKm": "600 km included",
      "extraKm": "₹8/km after 600 km",
      "insurance": "₹500 (comprehensive)",
      "extras": "₹100",
      "platformFee": "₹100",
      "gst": "₹405 (5% GST)",
      "securityDeposit": "₹5000 (refundable)"
    }
  }
}
```

**Rental Packages:**

| Category   | Hourly                   | Daily             | Weekly              | Monthly             |
| ---------- | ------------------------ | ----------------- | ------------------- | ------------------- |
| **Car**    | ₹150/hr (min 4hrs, 40km) | ₹2500/day (200km) | ₹15,000/wk (1400km) | ₹45,000/mo (6000km) |
| **Bike**   | ₹80/hr (min 4hrs, 30km)  | ₹800/day (150km)  | ₹4800/wk (1050km)   | ₹14,400/mo (4500km) |
| **Scooty** | ₹60/hr (min 4hrs, 24km)  | ₹600/day (120km)  | ₹3600/wk (840km)    | ₹10,800/mo (3600km) |

**Security Deposits:** Car: ₹5000, Bike: ₹2000, Scooty: ₹1500

**Insurance Options:**

- **Basic** (included): Third-party coverage
- **Comprehensive** (+₹500 Car, +₹200 Bike, +₹150 Scooty): Full damage coverage
- **Zero Deductible** (+₹1000 Car, +₹400 Bike, +₹300 Scooty): No out-of-pocket expense

---

### 2. Search Available Vehicles

Find vehicles available for specific dates, location, and category.

```bash
POST /api/bookings/search-vehicles
Content-Type: application/json

{
  "pickupDate": "2025-12-25T10:00:00Z",
  "returnDate": "2025-12-28T10:00:00Z",
  "category": "Car",  // Optional
  "city": "New Delhi",  // Optional
  "latitude": 28.6139,  // Optional
  "longitude": 77.2090,  // Optional
  "maxDistance": 10000  // Optional, in meters (default 10km)
}
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "vehicles": [
    {
      "vehicleId": 10,
      "registrationNumber": "DL04GH4444",
      "category": "Car",
      "brand": "Maruti Suzuki",
      "model": "Swift",
      "vehicleName": "Maruti Swift VXI",
      "color": "Blue",
      "fuelType": "Petrol",
      "year": 2021,
      "isAvailable": true,
      "currentLocation": {
        "address": "Rohini Sector 10",
        "city": "New Delhi",
        "state": "Delhi"
      },
      "pricing": {
        "baseRate": 7500,
        "totalAmount": 7975,
        "includedKm": 600
      },
      "rentalPackage": "daily",
      "duration": { "days": 3 }
    }
  ]
}
```

---

### 3. Create Rental Booking

Create a new rental reservation with customer details and documents.

```bash
POST /api/bookings
Content-Type: application/json

{
  "customerName": "Rahul Kumar",
  "customerPhone": "9876543210",
  "customerEmail": "rahul@example.com",
  "customerAge": 28,
  "vehicleId": 10,
  "pickupDate": "2025-12-25T10:00:00Z",
  "returnDate": "2025-12-28T10:00:00Z",
  "insuranceType": "comprehensive",  // Optional: "basic" | "comprehensive" | "zero-deductible"
  "extras": {  // Optional
    "gps": true,
    "childSeat": false,
    "additionalDriver": false
  },
  "drivingLicense": {  // Optional (can be uploaded later)
    "number": "DL0520210012345",
    "expiryDate": "2030-12-31",
    "photoUrl": "https://example.com/license.jpg"
  },
  "aadharCard": {  // Optional
    "number": "1234 5678 9012",
    "photoUrl": "https://example.com/aadhar.jpg"
  },
  "purposeOfTrip": "vacation",  // Optional: "vacation" | "business" | "commute" | "other"
  "emergencyContact": {  // Optional
    "name": "Priya Kumar",
    "phone": "9876543211",
    "relationship": "wife"
  },
  "paymentMethod": "card"  // Optional: "card" | "upi" | "netbanking" | "wallet"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Booking created successfully. Please complete document verification.",
  "booking": {
    "bookingId": 2,
    "customerName": "Rahul Kumar",
    "vehicleName": "Maruti Swift VXI",
    "registrationNumber": "DL04GH4444",
    "status": "pending_verification",
    "scheduledPickupDate": "2025-12-25T10:00:00.000Z",
    "scheduledReturnDate": "2025-12-28T10:00:00.000Z",
    "pricing": {
      "totalAmount": 8605,
      "securityDeposit": 5000,
      "pendingAmount": 8605
    },
    "pickupStation": {
      "stationName": "Rohini Sector 10",
      "address": "Rohini Sector 10, North West Delhi",
      "city": "New Delhi"
    }
  },
  "pricingBreakdown": {
    "baseRental": "₹7500 (daily package)",
    "includedKm": "600 km included",
    "insurance": "₹500 (comprehensive)",
    "totalAmount": "₹8605"
  }
}
```

**Booking Status Flow:**

1. `pending_verification` → Documents submitted, awaiting verification
2. `confirmed` → Documents verified, payment completed
3. `vehicle_ready` → Vehicle prepared for pickup
4. `active` → Customer picked up vehicle
5. `extended` → Rental period extended
6. `completed` → Vehicle returned successfully
7. `cancelled` → Booking cancelled (with refund calculation)
8. `no_show` → Customer didn't show up

---

### 4. Get All Bookings

List bookings with filters and pagination.

```bash
GET /api/bookings?status=active&customerPhone=9876543210&category=Car&page=1&limit=20
```

**Query Parameters:**

- `status` - Filter by booking status
- `customerPhone` - Filter by customer phone
- `vehicleId` - Filter by vehicle ID
- `category` - Filter by vehicle category
- `fromDate` - Filter bookings from date
- `toDate` - Filter bookings to date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "bookings": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### 5. Get Booking by ID

Get detailed information about a specific booking.

```bash
GET /api/bookings/:id
```

**Example:**

```bash
curl http://localhost:3002/api/bookings/2
```

---

### 6. Update Booking Status

Admin endpoint to update booking status.

```bash
PATCH /api/bookings/:id/status
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Payment verified and documents approved",
  "updatedBy": "admin"
}
```

**Valid Status Transitions:**

- `pending_verification` → `confirmed` or `cancelled`
- `confirmed` → `vehicle_ready` or `cancelled`
- `vehicle_ready` → `active` or `no_show`
- `active` → `completed` or `extended` or `suspended`
- `extended` → `completed` or `suspended`

---

### 7. Process Vehicle Pickup

Record vehicle pickup with condition inspection.

```bash
POST /api/bookings/:id/pickup
Content-Type: application/json

{
  "pickupCondition": {
    "fuelLevel": 100,  // Percentage
    "odometerReading": 12450,  // KM
    "photos": [
      "https://example.com/pickup-front.jpg",
      "https://example.com/pickup-left.jpg"
    ],
    "damages": [
      {
        "location": "front_bumper",
        "description": "Minor scratch on left side",
        "severity": "minor",
        "photoUrl": "https://example.com/damage1.jpg"
      }
    ]
  },
  "checkedBy": "Station Manager - Delhi"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vehicle picked up successfully",
  "booking": {
    "bookingId": 2,
    "status": "active",
    "actualPickupDate": "2025-12-25T10:15:00.000Z",
    "pickupCondition": {
      "fuelLevel": 100,
      "odometerReading": 12450,
      "checkedBy": "Station Manager - Delhi",
      "checkedAt": "2025-12-25T10:15:00.000Z"
    }
  }
}
```

---

### 8. Process Vehicle Return

Record vehicle return with condition check and charge calculations.

```bash
POST /api/bookings/:id/return
Content-Type: application/json

{
  "returnCondition": {
    "fuelLevel": 95,  // Percentage
    "odometerReading": 13080,  // KM (630 km driven)
    "photos": [
      "https://example.com/return-front.jpg"
    ],
    "damages": []  // No new damages
  },
  "checkedBy": "Station Manager - Delhi"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Vehicle returned successfully",
  "booking": {
    "bookingId": 2,
    "status": "completed",
    "actualReturnDate": "2025-12-28T11:00:00.000Z",
    "pricing": {
      "actualKmDriven": 630,
      "includedKm": 600,
      "extraKmCharges": 240, // 30 km × ₹8
      "totalAmount": 8845
    }
  },
  "additionalCharges": {
    "extraKm": 240,
    "lateReturn": 0
  }
}
```

**Extra KM Charges:**

- Driven: 630 km, Included: 600 km → Extra: 30 km
- Extra charge: 30 km × ₹8/km = **₹240**

**Late Return Charges:**

- **Hourly rentals:** ₹50/hr (Scooty), ₹70/hr (Bike), ₹100/hr (Car)
- **Daily/Weekly/Monthly:** Per-day charges (₹600-₹2500 depending on category)
- **Grace period:** 1 hour for hourly, 2 hours for daily+

---

### 9. Request Extension

Extend rental period while active.

```bash
POST /api/bookings/:id/extend
Content-Type: application/json

{
  "newReturnDate": "2025-12-30T10:00:00Z",
  "reason": "Trip extended by 2 days"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Extension request submitted",
  "additionalCharges": 5050,
  "duration": {
    "hours": 48,
    "days": 2
  }
}
```

**Note:** Extension pricing uses same rates as original booking. Admin needs to approve extension request.

---

### 10. Cancel Booking

Cancel a booking with refund calculation.

```bash
POST /api/bookings/:id/cancel
Content-Type: application/json

{
  "reason": "Change of plans",
  "cancelledBy": "customer"  // or "admin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Booking cancelled",
  "cancellationFee": 2151, // 25%
  "refundAmount": 6454, // 75%
  "refundPercentage": 75
}
```

**Cancellation Policy:**

| Time Before Pickup | Cancellation Fee | Refund |
| ------------------ | ---------------- | ------ |
| More than 72 hours | 0%               | 100%   |
| 48-72 hours        | 25%              | 75%    |
| 24-48 hours        | 50%              | 50%    |
| Less than 24 hours | 75%              | 25%    |
| After pickup       | 100%             | 0%     |

**Note:** Security deposit is always refunded (unless deductions for damages).

---

### 11. Submit Rating

Rate completed booking.

```bash
POST /api/bookings/:id/rate
Content-Type: application/json

{
  "overall": 5,  // 1-5 stars
  "vehicleCondition": 5,
  "cleanliness": 4,
  "service": 5,
  "value": 4,
  "feedback": "Great experience! Car was clean and well-maintained.",
  "photos": [
    "https://example.com/review1.jpg"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Rating submitted successfully"
}
```

---

### 12. Get Booking Statistics

Admin dashboard statistics.

```bash
GET /api/bookings/stats/overview?fromDate=2025-12-01&toDate=2025-12-31
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalBookings": 145,
    "activeBookings": 23,
    "completedBookings": 98,
    "cancelledBookings": 12,
    "totalRevenue": 487500,
    "categoryStats": [
      {
        "category": "Car",
        "bookings": 82,
        "revenue": 325000
      },
      {
        "category": "Bike",
        "bookings": 43,
        "revenue": 98500
      },
      {
        "category": "Scooty",
        "bookings": 20,
        "revenue": 64000
      }
    ]
  }
}
```

---

## 🔧 Testing Examples

### Complete Rental Flow

**1. Check availability and pricing:**

```bash
curl -X POST http://localhost:3002/api/bookings/estimate-price \
  -H "Content-Type: application/json" \
  -d '{
    "pickupDate": "2025-12-25T10:00:00Z",
    "returnDate": "2025-12-28T10:00:00Z",
    "category": "Car"
  }'
```

**2. Create booking:**

```bash
curl -X POST http://localhost:3002/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Rahul Kumar",
    "customerPhone": "9876543210",
    "customerEmail": "rahul@example.com",
    "customerAge": 28,
    "vehicleId": 10,
    "pickupDate": "2025-12-25T10:00:00Z",
    "returnDate": "2025-12-28T10:00:00Z",
    "insuranceType": "comprehensive"
  }'
```

**3. Verify documents (admin):**

```bash
curl -X PATCH http://localhost:3002/api/bookings/2/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "updatedBy": "admin",
    "notes": "Documents verified"
  }'
```

**4. Pickup vehicle:**

```bash
curl -X POST http://localhost:3002/api/bookings/2/pickup \
  -H "Content-Type: application/json" \
  -d '{
    "pickupCondition": {
      "fuelLevel": 100,
      "odometerReading": 12450
    },
    "checkedBy": "Station Manager"
  }'
```

**5. Return vehicle:**

```bash
curl -X POST http://localhost:3002/api/bookings/2/return \
  -H "Content-Type: application/json" \
  -d '{
    "returnCondition": {
      "fuelLevel": 95,
      "odometerReading": 13080
    },
    "checkedBy": "Station Manager"
  }'
```

**6. Rate booking:**

```bash
curl -X POST http://localhost:3002/api/bookings/2/rate \
  -H "Content-Type: application/json" \
  -d '{
    "overall": 5,
    "vehicleCondition": 5,
    "cleanliness": 4,
    "service": 5,
    "value": 4,
    "feedback": "Excellent service!"
  }'
```

---

## 🎯 Key Differences: ZoomCar vs. Ola/Uber

| Feature              | ZoomCar (Rental)                    | Ola/Uber (Ride-Hailing)   |
| -------------------- | ----------------------------------- | ------------------------- |
| **Driver**           | Self-drive (no driver)              | Driver-assigned           |
| **Pricing**          | Time-based (hourly/daily)           | Distance + time-based     |
| **Duration**         | Hours to months                     | Minutes to hours          |
| **KM Limit**         | Package allowance (e.g., 200km/day) | Unlimited (pay per km)    |
| **Documents**        | License, Aadhar required            | Not required for customer |
| **Security Deposit** | ₹1500-₹5000                         | Not applicable            |
| **Location**         | Fixed pickup/return stations        | Dynamic pickup/drop       |
| **Tracking**         | Vehicle condition (fuel, odometer)  | Real-time GPS tracking    |
| **Insurance**        | Customer chooses coverage level     | Included in fare          |

---

## 📊 Business Model

### Revenue Streams

1. **Rental Charges** - Base rental rates
2. **Insurance Upgrades** - Comprehensive & zero-deductible
3. **Extras** - GPS, child seat, additional driver
4. **Platform Fee** - ₹100 per booking
5. **Late Return Charges** - Penalty for delays
6. **Extra KM Charges** - Overage beyond allowance
7. **Damage Charges** - Deducted from security deposit
8. **Cleaning Charges** - If vehicle returned dirty

### Cost Structure

- Vehicle acquisition/leasing
- Insurance (commercial)
- Maintenance & servicing
- Fuel (for repositioning)
- Station/hub operations
- Platform technology
- Customer support

---

## 🔒 Security & Compliance

### Document Verification

- **Driving License:** Must be valid for at least 6 months, minimum 1 year old
- **Aadhar Card:** For identity verification and address proof
- **Age Requirement:** Minimum 21 years (18 for scooters)

### Damage Protection

- **Basic Insurance:** Third-party liability (included)
- **Comprehensive:** Vehicle damage coverage with ₹5000 deductible
- **Zero Deductible:** No out-of-pocket cost for damage

### Security Deposit

- Refunded within 7 days of return (minus deductions)
- Deductions for: damages, cleaning, extra fuel, violations

---

## 📱 Integration Notes

### Frontend Requirements

1. **Date/Time Pickers** - For pickup and return scheduling
2. **Vehicle Gallery** - Show available vehicles with images
3. **Document Upload** - License & Aadhar photo capture
4. **Pricing Calculator** - Real-time price updates with extras
5. **Pickup/Return Inspection** - Photo capture for condition
6. **Payment Gateway** - For booking payment & security deposit
7. **Rating System** - Post-rental feedback
8. **Booking Management** - View active/past rentals

### Admin Dashboard

1. **Booking Management** - Approve, verify, track
2. **Vehicle Availability** - Calendar view of bookings
3. **Document Verification** - Review license/Aadhar
4. **Condition Inspection** - View pickup/return photos
5. **Analytics** - Revenue, utilization, popular vehicles
6. **Customer Support** - Handle extensions, cancellations

---

## 🚀 Next Steps

### Pending Features

1. **Rental Stations/Hubs** - Model and management routes
2. **Vehicle Transmission** - Add Manual/Automatic field
3. **Seating Capacity** - Add to vehicle model
4. **Promo Codes** - Discount management
5. **Loyalty Program** - Repeat customer benefits
6. **Fuel Policy** - Track fuel usage charges
7. **Payment Integration** - Razorpay, Stripe, etc.
8. **SMS/Email Notifications** - Booking confirmations, reminders
9. **Violations Tracking** - Speeding, parking tickets
10. **Damage Assessment** - Auto-calculate repair costs

---

## 📞 Support

For API issues or questions:

- Check server logs: `backend/logs/`
- Database: MongoDB connection via `.env`
- Test vehicles: vehicleIds 7-12 (seeded with Delhi NCR locations)

**Happy Renting! 🚗💨**
