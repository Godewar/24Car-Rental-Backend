# Booking & Location-Based API Documentation

## Overview

This backend now includes a complete ride-hailing/booking system similar to Zomato/Ola with:

- ✅ Location-based vehicle search
- ✅ Dynamic fare estimation
- ✅ Real-time availability tracking
- ✅ Vehicle category filtering (Car, Bike, Scooty)
- ✅ Surge pricing
- ✅ Booking management

## Base URL

```
http://localhost:4000/api
```

---

## 🚗 Booking Endpoints

### 1. Estimate Fare

Get fare estimates for all vehicle categories for a trip.

**Endpoint:** `POST /api/bookings/estimate-fare`

**Request Body:**

```json
{
  "pickupLat": 28.6139,
  "pickupLon": 77.209,
  "dropoffLat": 28.7041,
  "dropoffLon": 77.1025,
  "demandLevel": "medium",
  "bookingTime": "2025-12-09T10:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "estimates": [
    {
      "category": "Bike",
      "distance": 12.5,
      "estimatedDuration": 45,
      "baseFare": 30,
      "distanceFare": 100,
      "timeFare": 67.5,
      "subtotal": 197.5,
      "surgeMultiplier": 1.2,
      "surgeFare": 39.5,
      "platformFee": 5,
      "totalBeforeTax": 242,
      "gst": 12.1,
      "discount": 0,
      "totalFare": 254.1,
      "breakdown": {
        "base": "₹30",
        "distance": "₹100 (12.5 km × ₹8/km)",
        "time": "₹67.5 (45 min × ₹1.5/min)",
        "surge": "₹39.5 (1.2x surge)",
        "platform": "₹5",
        "tax": "₹12.1 (5% GST)",
        "discount": "No discount"
      }
    },
    {
      "category": "Scooty",
      "...": "..."
    },
    {
      "category": "Car",
      "...": "..."
    }
  ]
}
```

---

### 2. Search Nearby Vehicles

Find available vehicles near a location.

**Endpoint:** `POST /api/bookings/search-vehicles`

**Request Body:**

```json
{
  "latitude": 28.6139,
  "longitude": 77.209,
  "category": "Car",
  "maxDistance": 5000
}
```

**Query Parameters:**

- `latitude` (required): Pickup latitude
- `longitude` (required): Pickup longitude
- `category` (optional): Filter by category (Car/Bike/Scooty)
- `maxDistance` (optional): Max search radius in meters (default: 5000)

**Response:**

```json
{
  "success": true,
  "count": 3,
  "vehicles": [
    {
      "vehicleId": 101,
      "category": "Car",
      "vehicleName": "Honda City",
      "registrationNumber": "DL01AB1234",
      "brand": "Honda",
      "model": "City",
      "isAvailable": true,
      "status": "active",
      "currentLocation": {
        "type": "Point",
        "coordinates": [77.21, 28.615],
        "address": "Connaught Place, New Delhi"
      },
      "distanceFromPickup": 1.2,
      "estimatedArrival": 5
    }
  ]
}
```

---

### 3. Create Booking

Create a new ride booking.

**Endpoint:** `POST /api/bookings`

**Request Body:**

```json
{
  "customerName": "John Doe",
  "customerPhone": "+919876543210",
  "customerEmail": "john@example.com",
  "vehicleId": 101,
  "pickupLocation": {
    "coordinates": [77.209, 28.6139],
    "address": "Connaught Place, New Delhi",
    "landmark": "Metro Station",
    "city": "New Delhi",
    "state": "Delhi",
    "pincode": "110001"
  },
  "dropoffLocation": {
    "coordinates": [77.1025, 28.7041],
    "address": "Rohini, New Delhi",
    "landmark": "Rohini West Metro",
    "city": "New Delhi",
    "state": "Delhi",
    "pincode": "110085"
  },
  "bookingType": "immediate",
  "scheduledPickupTime": null,
  "numberOfPassengers": 2,
  "specialRequests": "Please call on arrival",
  "paymentMethod": "cash",
  "demandLevel": "medium"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "bookingId": 1001,
    "customerName": "John Doe",
    "customerPhone": "+919876543210",
    "vehicleId": 101,
    "vehicleCategory": "Car",
    "status": "pending",
    "estimatedDistance": 12.5,
    "estimatedDuration": 45,
    "totalFare": 254.1,
    "paymentMethod": "cash",
    "createdAt": "2025-12-09T10:00:00Z"
  },
  "fareBreakdown": {
    "base": "₹50",
    "distance": "₹150 (12.5 km × ₹12/km)",
    "...": "..."
  }
}
```

---

### 4. Get All Bookings

Retrieve bookings with filters.

**Endpoint:** `GET /api/bookings`

**Query Parameters:**

- `status`: Filter by status (pending/confirmed/started/completed/cancelled)
- `customerPhone`: Filter by customer phone
- `vehicleId`: Filter by vehicle ID
- `driverId`: Filter by driver ID
- `category`: Filter by vehicle category
- `fromDate`: Start date (ISO format)
- `toDate`: End date (ISO format)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Example:**

```
GET /api/bookings?status=completed&page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "bookings": [
    {
      "bookingId": 1001,
      "customerName": "John Doe",
      "status": "completed",
      "totalFare": 254.1,
      "...": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### 5. Get Booking by ID

**Endpoint:** `GET /api/bookings/:id`

**Example:**

```
GET /api/bookings/1001
```

---

### 6. Update Booking Status

**Endpoint:** `PATCH /api/bookings/:id/status`

**Request Body:**

```json
{
  "status": "started",
  "notes": "Trip started",
  "updatedBy": "driver"
}
```

**Status Flow:**

```
pending → confirmed → driver_assigned → driver_arrived → started → completed
         ↓
      cancelled / driver_cancelled / no_show
```

---

### 7. Assign Driver

**Endpoint:** `PATCH /api/bookings/:id/assign-driver`

**Request Body:**

```json
{
  "driverId": "64f9a0b1c2d3e4f5a6b7c8d9"
}
```

---

### 8. Cancel Booking

**Endpoint:** `POST /api/bookings/:id/cancel`

**Request Body:**

```json
{
  "reason": "Customer changed plans",
  "cancelledBy": "customer"
}
```

**Cancellation Charges:**

- pending: 0%
- confirmed: 10% of fare
- driver_assigned: 20% of fare
- driver_arrived: 50% of fare
- started: 100% of fare

---

### 9. Rate Booking

**Endpoint:** `POST /api/bookings/:id/rate`

**Request Body:**

```json
{
  "customerRating": 5,
  "customerFeedback": "Great service!",
  "driverRating": 4,
  "driverFeedback": "Good driver"
}
```

---

### 10. Booking Statistics

**Endpoint:** `GET /api/bookings/stats/overview`

**Query Parameters:**

- `fromDate`: Start date
- `toDate`: End date

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalBookings": 1250,
    "completedBookings": 980,
    "cancelledBookings": 150,
    "activeBookings": 45,
    "totalRevenue": 245680.5,
    "categoryStats": [
      {
        "category": "Car",
        "bookings": 650,
        "revenue": 156000
      },
      {
        "category": "Bike",
        "bookings": 400,
        "revenue": 58000
      },
      {
        "category": "Scooty",
        "bookings": 200,
        "revenue": 31680.5
      }
    ]
  }
}
```

---

## 🚙 Enhanced Vehicle Endpoints

### 1. Get Nearby Vehicles (Location-Based)

**Endpoint:** `GET /api/vehicles/nearby`

**Query Parameters:**

- `latitude` (required): Current latitude
- `longitude` (required): Current longitude
- `category` (optional): Filter by category
- `maxDistance` (optional): Max distance in meters (default: 5000)
- `availableOnly` (optional): true/false (default: true)

**Example:**

```
GET /api/vehicles/nearby?latitude=28.6139&longitude=77.2090&category=Car&maxDistance=3000
```

**Response:**

```json
{
  "count": 5,
  "vehicles": [
    {
      "vehicleId": 101,
      "category": "Car",
      "vehicleName": "Honda City",
      "registrationNumber": "DL01AB1234",
      "isAvailable": true,
      "status": "active",
      "currentLocation": {
        "type": "Point",
        "coordinates": [77.21, 28.615],
        "address": "Connaught Place"
      },
      "distanceKm": 0.85
    }
  ]
}
```

---

### 2. Search Vehicles (Enhanced)

**Endpoint:** `GET /api/vehicles/search`

**Query Parameters (All existing + new):**

- `q`: General search
- `category`: Filter by category (Car/Bike/Scooty)
- `registrationNumber`
- `brand`
- `model`
- `vehicleName`
- `color`
- `fuelType`
- `status`
- `kycStatus`
- `minYear`
- `maxYear`
- `assignedDriver`

**Example:**

```
GET /api/vehicles/search?category=Bike&status=active&kycStatus=verified
```

---

### 3. Get Vehicle Categories

**Endpoint:** `GET /api/vehicles/categories`

**Response:**

```json
[
  { "key": "Car", "label": "Car" },
  { "key": "Bike", "label": "Bike" },
  { "key": "Scooty", "label": "Scooty" }
]
```

---

### 4. Update Vehicle Location

You can update vehicle location when creating/updating a vehicle:

**Endpoint:** `PUT /api/vehicles/:id`

**Request Body (partial):**

```json
{
  "currentLocation": {
    "type": "Point",
    "coordinates": [77.209, 28.6139],
    "address": "Connaught Place, New Delhi",
    "city": "New Delhi",
    "state": "Delhi"
  },
  "isAvailable": true,
  "serviceArea": "Delhi NCR"
}
```

---

## 🎯 Key Features Implemented

### 1. **Location-Based Search**

- Geospatial queries using MongoDB 2dsphere index
- Find vehicles within specified radius
- Distance calculation using Haversine formula
- Sort by proximity

### 2. **Dynamic Fare Estimation**

- Base fare by category
- Distance-based pricing (per km)
- Time-based pricing (per minute)
- Surge pricing (peak hours, high demand)
- Weekend multiplier
- Platform fee & GST calculation
- Promo code & discount support

### 3. **Availability Management**

- Real-time availability tracking
- Prevent double booking
- Automatic availability updates on booking status changes
- Driver assignment validation

### 4. **Booking Lifecycle**

```
Create Booking → Assign Driver → Driver Arrives → Trip Starts → Trip Completes → Rate
      ↓
   Cancel (with charges)
```

### 5. **Vehicle Categories**

- Car: Higher base fare, suitable for 4+ passengers
- Bike: Medium fare, faster in traffic
- Scooty: Lowest fare, for solo riders

---

## 📊 Fare Calculation Logic

**Base Formula:**

```
Subtotal = Base Fare + (Distance × Per KM Rate) + (Duration × Per Minute Rate)
Subtotal = Max(Subtotal, Minimum Fare)
Surge Amount = Subtotal × (Surge Multiplier - 1.0)
Total Before Tax = Subtotal + Surge + Platform Fee
GST = Total Before Tax × 0.05
Final Total = Total Before Tax + GST - Discount
```

**Example (12.5 km Car ride with medium surge):**

```
Base: ₹50
Distance: 12.5 km × ₹12 = ₹150
Time: 45 min × ₹2 = ₹90
Subtotal: ₹290
Surge (1.2x): ₹58
Platform Fee: ₹5
Before Tax: ₹353
GST (5%): ₹17.65
Total: ₹370.65
```

---

## 🔧 Testing the APIs

### 1. Estimate Fare

```bash
curl -X POST http://localhost:4000/api/bookings/estimate-fare \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLat": 28.6139,
    "pickupLon": 77.2090,
    "dropoffLat": 28.7041,
    "dropoffLon": 77.1025,
    "demandLevel": "medium"
  }'
```

### 2. Search Nearby Vehicles

```bash
curl -X POST http://localhost:4000/api/bookings/search-vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "category": "Car",
    "maxDistance": 5000
  }'
```

### 3. Create Booking

```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerPhone": "+919876543210",
    "vehicleId": 1,
    "pickupLocation": {
      "coordinates": [77.2090, 28.6139],
      "address": "Connaught Place, Delhi"
    },
    "dropoffLocation": {
      "coordinates": [77.1025, 28.7041],
      "address": "Rohini, Delhi"
    },
    "bookingType": "immediate",
    "paymentMethod": "cash"
  }'
```

### 4. Get Nearby Vehicles (Location-based)

```bash
curl "http://localhost:4000/api/vehicles/nearby?latitude=28.6139&longitude=77.2090&category=Car"
```

---

## 🚀 Next Steps

To fully utilize these features:

1. **Add vehicle locations** when creating/updating vehicles
2. **Mark vehicles as available** (`isAvailable: true`)
3. **Set vehicle status to active** (`status: 'active'`)
4. **Create sample bookings** to test the flow
5. **Assign drivers** to bookings
6. **Update booking status** through the lifecycle

---

## 📝 Notes

- All coordinates use [longitude, latitude] format (GeoJSON standard)
- Distance is in kilometers
- Duration is in minutes
- Fare amounts are in rupees
- Timestamps are in ISO 8601 format
- Geospatial queries require MongoDB 2dsphere indexes (automatically created)

---

## 🔐 Security Considerations

- Add authentication middleware for production
- Validate user permissions
- Rate limit fare estimation endpoint
- Sanitize location data
- Implement payment gateway integration
- Add OTP verification for pickups
