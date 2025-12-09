# 🚗 24Car Rental - Complete Backend Project Flow

> **Last Updated**: December 9, 2025  
> **Platform Type**: B2B Driver-Focused Vehicle Rental Platform  
> **Target Users**: Commercial Drivers (Uber, Ola, Taxi Operators)

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Business Flows](#core-business-flows)
3. [API Endpoints Summary](#api-endpoints-summary)
4. [Database Models](#database-models)
5. [Authentication & Authorization](#authentication--authorization)
6. [Payment Integration](#payment-integration)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [Module Details](#module-details)

---

## 🏗️ Architecture Overview

### Technology Stack

```
├── Runtime: Node.js + Express.js
├── Database: MongoDB + Mongoose ODM
├── Authentication: JWT + OTP (SMS)
├── Payment Gateway: Zwitch
├── File Storage: Cloudinary
├── Email Service: Custom SMTP
└── Architecture: MVC Pattern
```

### Server Configuration

```javascript
Entry Point: server.js
Port: 4000 (configurable via .env)
Database: MongoDB Atlas/Local
CORS: Enabled for all origins
Body Parser: 50MB limit (supports image uploads)
```

### Route Structure

```
/api
  ├── /auth                      # User authentication
  ├── /drivers                   # Driver management
  │   ├── /signup               # Driver signup with OTP
  │   ├── /login                # Driver login with OTP
  │   ├── /signup-otp           # OTP for signup
  │   └── /login-otp            # OTP for login
  ├── /vehicles                  # Vehicle inventory
  ├── /bookings                  # Booking/rental management
  ├── /payments                  # Payment processing
  ├── /driver-plans             # Subscription plans
  ├── /driver-plan-selections   # Driver plan enrollments
  ├── /driver-wallet            # Wallet management
  ├── /driver-wallet-message    # Wallet notifications
  ├── /expenses                 # Business expenses
  ├── /transactions             # Financial transactions
  ├── /tickets                  # Support tickets
  ├── /dashboard               # Analytics & metrics
  ├── /managers                # Manager operations
  ├── /employees               # Employee management
  ├── /car-plans               # Vehicle purchase plans
  ├── /vehicle-options         # Vehicle features/specs
  ├── /weekly-rent-plans       # Weekly rental pricing
  ├── /daily-rent-plans        # Daily rental pricing
  └── /static                  # Static reference data
```

---

## 🔄 Core Business Flows

### 1. **Driver Rental Journey** (Primary Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                    DRIVER RENTAL LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────┘

1️⃣ DISCOVERY & REGISTRATION
   ↓
   Driver Signup/Login → OTP Verification → Profile Creation
   ├─ POST /api/drivers/signup-otp
   ├─ POST /api/drivers/signup
   ├─ POST /api/drivers/login-otp
   └─ POST /api/drivers/login

2️⃣ VEHICLE DISCOVERY
   ↓
   Browse Vehicles → Filter by Category → View Details
   ├─ GET /api/vehicles?category=Car&status=available
   ├─ GET /api/vehicles/categories
   ├─ GET /api/vehicles/nearby?lat=12.9716&lng=77.5946
   ├─ GET /api/vehicles/search?q=swift
   └─ GET /api/vehicles/:id

3️⃣ PRICE ESTIMATION
   ↓
   Select Vehicle → Choose Duration → Get Pricing
   ├─ POST /api/bookings/estimate-price
   │   Body: { vehicleId, pickupDate, returnDate, rentalType }
   └─ Response: { totalAmount, dailyRate, weeklyRate, deposit }

4️⃣ BOOKING CREATION
   ↓
   Submit Booking Request → Document Verification → Confirmation
   ├─ POST /api/bookings
   │   Body: {
   │     driverName, driverPhone, driverEmail, driverAge,
   │     vehicleId, pickupDate, returnDate,
   │     pickupLocation, returnLocation,
   │     drivingLicense, aadharCard
   │   }
   └─ Response: { bookingId, status: "pending", totalAmount }

5️⃣ PAYMENT PROCESSING
   ↓
   Security Deposit → Payment Gateway → Confirmation
   ├─ POST /api/payments/drivers/create
   │   Body: { bookingId, amount, paymentMethod }
   ├─ POST /api/payments/zwitch/payout (for refunds)
   └─ Booking Status: "pending" → "confirmed"

6️⃣ VEHICLE PICKUP
   ↓
   Driver Arrives → Vehicle Inspection → Documents Verified → Keys Handed Over
   ├─ POST /api/bookings/:id/pickup
   │   Body: { pickupTime, vehicleConditionPhotos, odometerReading }
   └─ Booking Status: "confirmed" → "active"

7️⃣ ACTIVE RENTAL PERIOD
   ↓
   Driver Uses Vehicle → Earnings Tracked → Support Available
   ├─ GET /api/bookings/:id (check booking status)
   ├─ POST /api/bookings/:id/extend (extend rental period)
   ├─ POST /api/tickets (customer support)
   └─ Booking Status: "active"

8️⃣ VEHICLE RETURN
   ↓
   Driver Returns → Final Inspection → Calculate Dues → Refund Deposit
   ├─ POST /api/bookings/:id/return
   │   Body: { returnTime, vehicleConditionPhotos, odometerReading }
   ├─ Calculate: Extra mileage, damage charges, late fees
   ├─ POST /api/payments/drivers/:id (process refund)
   └─ Booking Status: "active" → "completed"

9️⃣ RATING & FEEDBACK
   ↓
   Driver Rates Experience → Review Submission → Analytics Update
   ├─ POST /api/bookings/:id/rate
   │   Body: {
   │     overall, vehicleCondition, cleanliness,
   │     service, value, feedback, photos
   │   }
   └─ Vehicle Rating Updated → Analytics Dashboard Updated

🔟 CANCELLATION (Optional)
   ↓
   Cancellation Request → Refund Processing → Vehicle Released
   ├─ POST /api/bookings/:id/cancel
   │   Body: { reason, cancelledBy: "driver" }
   ├─ Calculate Cancellation Charges
   └─ Booking Status: Any → "cancelled"
```

---

### 2. **Driver Plan Subscription Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│               DRIVER SUBSCRIPTION MANAGEMENT                     │
└─────────────────────────────────────────────────────────────────┘

1️⃣ PLAN DISCOVERY
   ├─ GET /api/driver-plans
   └─ Response: Weekly/Monthly plans with pricing tiers

2️⃣ PLAN SELECTION
   ├─ POST /api/driver-plan-selections
   │   Body: { driverId, planId, vehicleId, startDate }
   └─ Status: "pending"

3️⃣ PAYMENT CONFIRMATION
   ├─ POST /api/driver-plan-selections/:id/confirm-payment
   │   Body: { amount, paymentMethod, transactionId }
   └─ Status: "pending" → "active"

4️⃣ RENT TRACKING
   ├─ GET /api/driver-plan-selections/:id/rent-summary
   └─ Response: { totalRent, paidAmount, dueAmount, nextDueDate }

5️⃣ PLAN STATUS UPDATES
   ├─ PUT /api/driver-plan-selections/:id/status
   │   Body: { status: "suspended" | "active" | "completed" }
   └─ Vehicle availability updated accordingly
```

---

### 3. **Vehicle Management Flow** (Admin/Manager)

```
┌─────────────────────────────────────────────────────────────────┐
│                  VEHICLE LIFECYCLE MANAGEMENT                    │
└─────────────────────────────────────────────────────────────────┘

1️⃣ VEHICLE ONBOARDING
   ├─ POST /api/vehicles
   │   Body: {
   │     registrationNumber, model, brand, category,
   │     year, fuelType, images, documents
   │   }
   └─ Vehicle Status: "available"

2️⃣ PRICING CONFIGURATION
   ├─ PUT /api/vehicles/:id/daily-rent-slabs
   │   Body: [{ minDays, maxDays, pricePerDay }]
   ├─ PUT /api/vehicles/:id/weekly-rent-slabs
   │   Body: [{ minWeeks, maxWeeks, pricePerWeek }]
   └─ Pricing rules saved

3️⃣ VEHICLE ASSIGNMENT
   ├─ POST /api/vehicles-by-driver
   │   Body: { vehicleId, driverId, assignmentDate }
   └─ Vehicle Status: "available" → "assigned"

4️⃣ MAINTENANCE & EXPENSES
   ├─ POST /api/expenses
   │   Body: { vehicleId, category, amount, description }
   └─ Expense tracked for profitability analysis

5️⃣ PROFIT TRACKING
   ├─ GET /api/vehicles/:id/monthly-profit
   └─ Response: { revenue, expenses, netProfit }
```

---

## 📡 API Endpoints Summary

### **Authentication & User Management** (15 endpoints)

| Method | Endpoint                              | Description            | Auth Required |
| ------ | ------------------------------------- | ---------------------- | ------------- |
| POST   | `/api/auth/register`                  | User registration      | ❌            |
| POST   | `/api/auth/login`                     | User login             | ❌            |
| POST   | `/api/drivers/signup-otp`             | Request OTP for signup | ❌            |
| POST   | `/api/drivers/signup`                 | Complete driver signup | ❌            |
| POST   | `/api/drivers/login-otp`              | Request OTP for login  | ❌            |
| POST   | `/api/drivers/login`                  | Complete driver login  | ❌            |
| GET    | `/api/drivers`                        | List all drivers       | ✅            |
| GET    | `/api/drivers/:id`                    | Get driver details     | ✅            |
| GET    | `/api/drivers/form/mobile/:phone`     | Get driver by phone    | ✅            |
| POST   | `/api/drivers`                        | Create driver          | ✅            |
| PUT    | `/api/drivers/:id`                    | Update driver          | ✅            |
| DELETE | `/api/drivers/:id`                    | Delete driver          | ✅            |
| GET    | `/api/drivers/earnings/summary`       | Driver earnings        | ✅            |
| GET    | `/api/drivers/signup/credentials`     | Get signup creds       | ✅            |
| PUT    | `/api/drivers/signup/credentials/:id` | Update signup creds    | ✅            |

---

### **Vehicle Management** (14 endpoints)

| Method | Endpoint                              | Description            | Auth Required |
| ------ | ------------------------------------- | ---------------------- | ------------- |
| GET    | `/api/vehicles`                       | List all vehicles      | ❌            |
| GET    | `/api/vehicles/:id`                   | Get vehicle details    | ❌            |
| GET    | `/api/vehicles/categories`            | Get vehicle categories | ❌            |
| GET    | `/api/vehicles/by-category/:category` | Filter by category     | ❌            |
| GET    | `/api/vehicles/nearby?lat&lng&radius` | Nearby vehicles        | ❌            |
| GET    | `/api/vehicles/search?q=`             | Search vehicles        | ❌            |
| POST   | `/api/vehicles`                       | Create vehicle         | ✅            |
| PUT    | `/api/vehicles/:id`                   | Update vehicle         | ✅            |
| DELETE | `/api/vehicles/:id`                   | Delete vehicle         | ✅            |
| GET    | `/api/vehicles/:id/daily-rent-slabs`  | Get daily pricing      | ❌            |
| PUT    | `/api/vehicles/:id/daily-rent-slabs`  | Update daily pricing   | ✅            |
| GET    | `/api/vehicles/:id/weekly-rent-slabs` | Get weekly pricing     | ❌            |
| PUT    | `/api/vehicles/:id/weekly-rent-slabs` | Update weekly pricing  | ✅            |
| GET    | `/api/vehicles/:id/monthly-profit`    | Get profit analysis    | ✅            |

---

### **Booking/Rental Management** (12 endpoints)

| Method | Endpoint                        | Description               | Auth Required |
| ------ | ------------------------------- | ------------------------- | ------------- |
| POST   | `/api/bookings/estimate-price`  | Estimate rental cost      | ❌            |
| POST   | `/api/bookings/search-vehicles` | Search available vehicles | ❌            |
| GET    | `/api/bookings/stats/overview`  | Booking statistics        | ✅            |
| POST   | `/api/bookings`                 | Create booking            | ✅            |
| GET    | `/api/bookings`                 | List all bookings         | ✅            |
| GET    | `/api/bookings/:id`             | Get booking details       | ✅            |
| PATCH  | `/api/bookings/:id/status`      | Update booking status     | ✅            |
| POST   | `/api/bookings/:id/pickup`      | Process vehicle pickup    | ✅            |
| POST   | `/api/bookings/:id/return`      | Process vehicle return    | ✅            |
| POST   | `/api/bookings/:id/extend`      | Extend rental period      | ✅            |
| POST   | `/api/bookings/:id/cancel`      | Cancel booking            | ✅            |
| POST   | `/api/bookings/:id/rate`        | Rate booking experience   | ✅            |

---

### **Payment Processing** (10 endpoints)

| Method | Endpoint                              | Description           | Auth Required |
| ------ | ------------------------------------- | --------------------- | ------------- |
| GET    | `/api/payments/zwitch/test`           | Test Zwitch config    | ✅            |
| POST   | `/api/payments/zwitch/payout`         | Process payout        | ✅            |
| GET    | `/api/payments/zwitch/status/:refId`  | Check payout status   | ✅            |
| POST   | `/api/payments/zwitch/verify-account` | Verify bank account   | ✅            |
| POST   | `/api/payments/zwitch/webhook`        | Zwitch webhook        | ❌            |
| GET    | `/api/payments/drivers`               | List driver payments  | ✅            |
| GET    | `/api/payments/drivers/:id`           | Get payment details   | ✅            |
| POST   | `/api/payments/drivers/create`        | Create payment record | ✅            |
| PUT    | `/api/payments/drivers/:id`           | Update payment        | ✅            |
| DELETE | `/api/payments/drivers/:id`           | Delete payment        | ✅            |

---

### **Driver Plans & Subscriptions** (11 endpoints)

| Method | Endpoint                                          | Description           | Auth Required |
| ------ | ------------------------------------------------- | --------------------- | ------------- |
| GET    | `/api/driver-plans`                               | List all plans        | ❌            |
| GET    | `/api/driver-plans/:id`                           | Get plan details      | ❌            |
| POST   | `/api/driver-plans`                               | Create plan           | ✅            |
| PUT    | `/api/driver-plans/:id`                           | Update plan           | ✅            |
| DELETE | `/api/driver-plans/:id`                           | Delete plan           | ✅            |
| GET    | `/api/driver-plan-selections`                     | List plan selections  | ✅            |
| POST   | `/api/driver-plan-selections`                     | Create plan selection | ✅            |
| GET    | `/api/driver-plan-selections/:id`                 | Get selection details | ✅            |
| PUT    | `/api/driver-plan-selections/:id`                 | Update selection      | ✅            |
| POST   | `/api/driver-plan-selections/:id/confirm-payment` | Confirm payment       | ✅            |
| GET    | `/api/driver-plan-selections/:id/rent-summary`    | Get rent summary      | ✅            |

---

### **Wallet Management** (2 endpoints)

| Method | Endpoint                    | Description         | Auth Required |
| ------ | --------------------------- | ------------------- | ------------- |
| POST   | `/api/driver-wallet`        | Credit/Debit wallet | ✅            |
| GET    | `/api/driver-wallet/:phone` | Get wallet balance  | ✅            |

---

### **Expense Tracking** (6 endpoints)

| Method | Endpoint                   | Description            | Auth Required |
| ------ | -------------------------- | ---------------------- | ------------- |
| GET    | `/api/expenses`            | List all expenses      | ✅            |
| GET    | `/api/expenses/categories` | Get expense categories | ✅            |
| GET    | `/api/expenses/:id`        | Get expense details    | ✅            |
| POST   | `/api/expenses`            | Create expense         | ✅            |
| PUT    | `/api/expenses/:id`        | Update expense         | ✅            |
| DELETE | `/api/expenses/:id`        | Delete expense         | ✅            |

---

### **Support & Analytics** (8+ endpoints)

| Method | Endpoint               | Description             | Auth Required |
| ------ | ---------------------- | ----------------------- | ------------- |
| GET    | `/api/tickets`         | List support tickets    | ✅            |
| POST   | `/api/tickets`         | Create support ticket   | ✅            |
| GET    | `/api/dashboard`       | Get dashboard metrics   | ✅            |
| GET    | `/api/transactions`    | List transactions       | ✅            |
| GET    | `/api/managers`        | List managers           | ✅            |
| GET    | `/api/employees`       | List employees          | ✅            |
| GET    | `/api/car-plans`       | List car purchase plans | ✅            |
| GET    | `/api/vehicle-options` | List vehicle features   | ✅            |

---

## 🗄️ Database Models

### **Core Models** (15 models)

```javascript
1. Driver
   ├─ Personal Info: name, email, phone, address, DOB
   ├─ Documents: license, aadhar, PAN, bank details
   ├─ Status: active, inactive, suspended
   ├─ Earnings: totalEarnings, rating, totalTrips
   └─ Relations: → Bookings, DriverPlanSelections

2. Vehicle
   ├─ Basic Info: model, brand, category, year
   ├─ Registration: regNumber, RC, insurance, PUC
   ├─ Pricing: dailyRentSlabs[], weeklyRentSlabs[]
   ├─ Status: available, assigned, maintenance
   ├─ Location: latitude, longitude
   └─ Relations: → Bookings, Expenses

3. Booking
   ├─ Driver Info: driverId, driverName, driverPhone
   ├─ Vehicle Info: vehicleId, category
   ├─ Schedule: pickupDate, returnDate, actualReturn
   ├─ Locations: pickupLocation, returnLocation
   ├─ Pricing: totalAmount, deposit, extraCharges
   ├─ Documents: drivingLicense, aadharCard
   ├─ Status: pending → confirmed → active → completed
   └─ Rating: driverRating { overall, condition, service }

4. DriverPlanSelection
   ├─ Plan Info: planId, planType, duration
   ├─ Driver: driverId, driverPhone
   ├─ Vehicle: vehicleId
   ├─ Financials: totalRent, paidAmount, dueAmount
   ├─ Schedule: startDate, endDate, nextDueDate
   └─ Status: pending, active, suspended, completed

5. DriverPlan
   ├─ Name: plan name (e.g., "Weekly Standard")
   ├─ Type: daily, weekly, monthly
   ├─ Pricing: amount, deposit
   ├─ Features: kmLimit, extraKmCharge
   └─ Status: active, inactive

6. DriverWallet
   ├─ phone: driver identifier
   ├─ balance: current wallet balance
   └─ transactions: [{ amount, type, description, date }]

7. Transaction
   ├─ type: booking, subscription, refund, penalty
   ├─ amount, status, paymentMethod
   ├─ bookingId, driverId
   └─ timestamp

8. Expense
   ├─ category: fuel, maintenance, insurance, other
   ├─ vehicleId, amount, description
   ├─ date, receiptUrl
   └─ approvedBy

9. Ticket
   ├─ title, description, priority
   ├─ createdBy (driverId), assignedTo
   ├─ status: open, in-progress, resolved, closed
   └─ messages: [{ sender, message, timestamp }]

10. User
    ├─ email, password (hashed)
    ├─ role: admin, manager, employee
    └─ permissions

11. Manager
    ├─ name, phone, email
    ├─ assignedVehicles: []
    └─ performance metrics

12. Employee
    ├─ name, phone, email, role
    └─ assignedTasks

13. CarPlan
    ├─ Vehicle purchase/financing plans
    └─ EMI details

14. VehicleOption
    ├─ Features: AC, GPS, Bluetooth
    └─ Add-on pricing

15. Dashboard
    ├─ Aggregated metrics
    └─ Real-time statistics
```

---

## 🔐 Authentication & Authorization

### **Authentication Methods**

```javascript
1. JWT Token Authentication
   ├─ User/Admin login → JWT token issued
   ├─ Token expires in 24 hours
   └─ Token sent in Authorization header

2. OTP-Based Authentication (Driver)
   ├─ POST /api/drivers/signup-otp → OTP sent to phone
   ├─ POST /api/drivers/signup → Verify OTP + create account
   ├─ POST /api/drivers/login-otp → OTP sent to phone
   └─ POST /api/drivers/login → Verify OTP + login

3. API Key Authentication
   └─ Zwitch payment webhook uses API key verification
```

### **Authorization Levels**

```javascript
Public Routes (No Auth):
├─ Vehicle browsing (/api/vehicles)
├─ Price estimation (/api/bookings/estimate-price)
├─ OTP requests (/api/drivers/*-otp)
└─ Driver signup/login

Driver Auth Required:
├─ Booking creation (/api/bookings)
├─ Profile management (/api/drivers/:id)
├─ Plan selection (/api/driver-plan-selections)
└─ Wallet operations (/api/driver-wallet)

Admin/Manager Auth:
├─ Vehicle management (/api/vehicles CRUD)
├─ Driver management (/api/drivers CRUD)
├─ Expense management (/api/expenses)
├─ Payment processing (/api/payments)
└─ Dashboard access (/api/dashboard)
```

---

## 💳 Payment Integration

### **Zwitch Payment Gateway**

```javascript
Configuration:
├─ API Key: Stored in .env
├─ Secret Key: For webhook verification
└─ Base URL: Production/Sandbox

Supported Operations:
1. Payout Processing
   POST /api/payments/zwitch/payout
   ├─ Send money to driver bank account
   └─ Use case: Security deposit refund

2. Account Verification
   POST /api/payments/zwitch/verify-account
   ├─ Verify bank account before payout
   └─ Prevents payment failures

3. Status Tracking
   GET /api/payments/zwitch/status/:referenceId
   ├─ Check payout status (pending/success/failed)
   └─ Webhook backup for status updates

4. Webhook Handler
   POST /api/payments/zwitch/webhook
   ├─ Receives real-time payment status updates
   └─ Updates booking/transaction status automatically
```

### **Payment Flow**

```
Driver Books Vehicle
  ↓
Security Deposit Collected (Manual/Online)
  ↓
Booking Confirmed → Status: "confirmed"
  ↓
Driver Uses Vehicle → Status: "active"
  ↓
Driver Returns Vehicle
  ↓
Calculate Final Amount:
├─ Base Rent: ₹X
├─ Extra KM Charges: ₹Y
├─ Damage Charges: ₹Z
└─ Total: ₹(X+Y+Z)
  ↓
Refund = Deposit - Total
  ↓
POST /api/payments/zwitch/payout
  ↓
Zwitch Processes Refund
  ↓
Webhook Confirms Success
  ↓
Booking Status → "completed"
```

---

## 📊 Data Flow Diagrams

### **1. Booking Creation Flow**

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌─────────┐
│ Driver  │────▶│  Backend    │────▶│ Database │────▶│ Payment │
│ App/Web │     │ API Server  │     │ MongoDB  │     │ Gateway │
└─────────┘     └─────────────┘     └──────────┘     └─────────┘
     │                 │                   │                │
     │ 1. POST        │                   │                │
     │ /bookings      │                   │                │
     ├───────────────▶│                   │                │
     │                │ 2. Validate       │                │
     │                │ Driver & Vehicle  │                │
     │                ├──────────────────▶│                │
     │                │                   │                │
     │                │ 3. Check Vehicle  │                │
     │                │ Availability      │                │
     │                │◀──────────────────┤                │
     │                │                   │                │
     │                │ 4. Calculate      │                │
     │                │ Pricing           │                │
     │                │                   │                │
     │                │ 5. Create Booking │                │
     │                ├──────────────────▶│                │
     │                │                   │                │
     │                │ 6. Send Payment   │                │
     │                │ Link (Optional)   │                │
     │                ├──────────────────────────────────▶│
     │                │                   │                │
     │ 7. Booking     │                   │                │
     │ Confirmation   │                   │                │
     │◀───────────────┤                   │                │
     │ (bookingId)    │                   │                │
```

### **2. Vehicle Pickup Flow**

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌───────────┐
│ Manager │────▶│  Backend    │────▶│ Database │────▶│ Cloudinary│
│ App     │     │ API Server  │     │ MongoDB  │     │ (Images)  │
└─────────┘     └─────────────┘     └──────────┘     └───────────┘
     │                 │                   │                │
     │ 1. POST        │                   │                │
     │ /bookings/:id  │                   │                │
     │ /pickup        │                   │                │
     ├───────────────▶│                   │                │
     │ + photos       │                   │                │
     │ + odometer     │                   │                │
     │                │ 2. Upload Photos  │                │
     │                ├──────────────────────────────────▶│
     │                │                   │                │
     │                │ 3. Update Booking │                │
     │                │ Status → "active" │                │
     │                ├──────────────────▶│                │
     │                │                   │                │
     │                │ 4. Update Vehicle │                │
     │                │ Status → "rented" │                │
     │                ├──────────────────▶│                │
     │                │                   │                │
     │ 5. Success     │                   │                │
     │◀───────────────┤                   │                │
```

### **3. Payment Refund Flow**

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌─────────┐
│ Backend │────▶│  Zwitch     │────▶│ Driver's │     │ Webhook │
│ System  │     │  Payment    │     │  Bank    │     │ Handler │
└─────────┘     └─────────────┘     └──────────┘     └─────────┘
     │                 │                   │                │
     │ 1. POST        │                   │                │
     │ /zwitch/payout │                   │                │
     ├───────────────▶│                   │                │
     │ + amount       │                   │                │
     │ + bank details │                   │                │
     │                │ 2. Process Payout │                │
     │                ├──────────────────▶│                │
     │                │                   │                │
     │                │ 3. Bank Transfer  │                │
     │                │ (1-2 days)        │                │
     │                │                   │                │
     │                │ 4. Status Update  │                │
     │                │ Webhook           │                │
     │                ├──────────────────────────────────▶│
     │                │                   │                │
     │                │                   │ 5. Update DB   │
     │◀────────────────────────────────────────────────────┤
     │                │                   │                │
```

---

## 📦 Module Details

### **1. Booking Module**

```javascript
Location: /backend/controllers/bookingController.js
Routes: /backend/routes/bookings.js

Key Functions:
├─ estimatePrice() - Calculate rental cost before booking
├─ searchVehicles() - Find available vehicles by criteria
├─ createBooking() - Create new rental booking
├─ getAllBookings() - List bookings with filters
├─ getBookingById() - Get specific booking details
├─ updateBookingStatus() - Change booking status
├─ processPickup() - Handle vehicle pickup
├─ processReturn() - Handle vehicle return + calculate charges
├─ extendBooking() - Extend rental period
├─ cancelBooking() - Cancel booking + refund logic
├─ rateBooking() - Driver rates the rental experience
└─ getBookingStats() - Analytics and metrics

Business Rules:
├─ Minimum rental: 1 day
├─ Security deposit: Required for all bookings
├─ Cancellation charges: Based on time before pickup
├─ Late return penalty: ₹500/hour
└─ Extra KM charge: As per vehicle pricing slab
```

### **2. Vehicle Module**

```javascript
Location: /backend/controllers/vehicleController.js
Routes: /backend/routes/vehicles.js

Key Functions:
├─ getAllVehicles() - List all vehicles
├─ getVehicleById() - Get vehicle details
├─ createVehicle() - Add new vehicle
├─ updateVehicle() - Update vehicle info
├─ deleteVehicle() - Remove vehicle
├─ getCategories() - List vehicle categories
├─ getVehiclesByCategory() - Filter by car/bike/scooty
├─ getNearbyVehicles() - Location-based search
├─ searchVehicles() - Full-text search
├─ getDailyRentSlabs() - Get daily pricing
├─ updateDailyRentSlabs() - Update daily pricing
├─ getWeeklyRentSlabs() - Get weekly pricing
├─ updateWeeklyRentSlabs() - Update weekly pricing
└─ getMonthlyProfit() - Calculate vehicle profitability

Vehicle States:
├─ available - Ready for booking
├─ assigned - Assigned to a driver
├─ rented - Currently with a driver
├─ maintenance - Under repair
└─ inactive - Not available for rental
```

### **3. Driver Module**

```javascript
Location: /backend/routes/drivers.js
Model: /backend/models/driver.js

Key Functions:
├─ getAllDrivers() - List all drivers
├─ getDriverById() - Get driver profile
├─ getDriverByPhone() - Find driver by phone number
├─ createDriver() - Register new driver
├─ updateDriver() - Update driver profile
├─ deleteDriver() - Remove driver
├─ getDriverEarningsSummary() - Calculate earnings
├─ getDriverSignupCredentials() - For onboarding
└─ updateDriverSignupCredential() - Update signup info

Driver Verification:
├─ KYC Documents: License, Aadhar, PAN
├─ Bank Account: For refunds and payouts
├─ Emergency Contact: Required for safety
└─ Verification Status: Pending → Verified → Active
```

### **4. Payment Module**

```javascript
Location: /backend/controllers/paymentController.js
Routes: /backend/routes/payments.js

Key Functions:
├─ testZwitchConfig() - Verify Zwitch API connection
├─ processZwitchPayout() - Send money to driver
├─ getZwitchPayoutStatus() - Check payout status
├─ verifyBankAccount() - Validate bank details
├─ handleZwitchWebhook() - Process webhook events
├─ getAllDriverPayments() - List all payments
├─ getDriverPaymentById() - Get payment details
├─ createDriverPayment() - Record new payment
├─ updateDriverPayment() - Update payment record
└─ deleteDriverPayment() - Remove payment record

Payment Types:
├─ security_deposit - Initial deposit
├─ rental_payment - Rental charges
├─ refund - Deposit refund
├─ penalty - Late fees, damage charges
└─ subscription - Plan payment
```

### **5. Expense Module**

```javascript
Location: /backend/controllers/expenseController.js
Routes: /backend/routes/expenses.js

Key Functions:
├─ getAllExpenses() - List all expenses
├─ getExpenseById() - Get expense details
├─ createExpense() - Record new expense
├─ updateExpense() - Update expense record
├─ deleteExpense() - Remove expense
└─ getCategories() - List expense categories

Expense Categories:
├─ fuel - Fuel costs
├─ maintenance - Repairs and servicing
├─ insurance - Insurance premiums
├─ registration - RC/permit renewals
├─ taxes - Road tax, etc.
└─ others - Miscellaneous expenses

Used For:
└─ Vehicle profitability analysis
```

### **6. Driver Plan Selection Module**

```javascript
Location: /backend/controllers/driverPlanSelectionController.js
Routes: /backend/routes/driverPlanSelections.js

Key Functions:
├─ getAllPlanSelections() - List all subscriptions
├─ getPlanSelectionById() - Get subscription details
├─ createPlanSelection() - New subscription
├─ updatePlanSelection() - Update subscription
├─ deletePlanSelection() - Cancel subscription
├─ confirmPayment() - Confirm plan payment
├─ getRentSummary() - Calculate dues
├─ updatePlanStatus() - Change status
├─ getPlansByMobile() - Driver's active plans
└─ getPaymentsByManager() - Manager's collections

Plan Status Flow:
pending → active → suspended → completed
         ↓
      cancelled
```

---

## 🔢 Key Statistics & Metrics

### **Dashboard Metrics**

```javascript
GET /api/dashboard

Returns:
├─ Total Bookings (today/week/month/all-time)
├─ Active Rentals (currently ongoing)
├─ Revenue (today/week/month/all-time)
├─ Total Drivers (active/inactive/pending verification)
├─ Total Vehicles (available/rented/maintenance)
├─ Booking Conversion Rate
├─ Average Booking Value
├─ Top Performing Vehicles
└─ Revenue Breakdown by Category
```

### **Driver Earnings**

```javascript
GET /api/drivers/earnings/summary

Returns:
├─ Total Earnings (all-time)
├─ This Month Earnings
├─ Pending Payments
├─ Completed Trips
├─ Average Rating
└─ Bonuses/Incentives
```

---

## 🎯 Business Model Summary

### **Revenue Streams**

```
1. Vehicle Rentals (Primary)
   ├─ Daily Rentals: Short-term drivers
   ├─ Weekly Rentals: Regular drivers
   └─ Monthly Subscriptions: Full-time drivers

2. Additional Charges
   ├─ Extra Kilometers: Beyond plan limit
   ├─ Late Return Fees: ₹500/hour
   ├─ Damage Charges: As per assessment
   └─ Plan Upgrade Fees

3. Commission/Deposits
   ├─ Security Deposits (refundable)
   └─ Booking Fees (if any)
```

### **Cost Structure**

```
1. Vehicle Costs
   ├─ Purchase/Lease: Initial investment
   ├─ Insurance: Annual premium
   ├─ Maintenance: Regular servicing
   ├─ Fuel: (if included in plan)
   └─ Depreciation

2. Operational Costs
   ├─ Platform Maintenance
   ├─ Payment Gateway Fees (2-3%)
   ├─ Customer Support
   └─ Marketing
```

### **Target Customers**

```
Primary: Commercial Drivers
├─ Uber/Ola Drivers
├─ Taxi Operators
├─ Delivery Partners
└─ Chauffeurs

Secondary: Fleet Managers
├─ Small fleet operators
└─ Corporate transport coordinators
```

---

## 🚀 Deployment & Scaling

### **Current Setup**

```
Server: Node.js + Express
Database: MongoDB (Cloud/Local)
Port: 4000
CORS: Enabled for all origins
Body Size Limit: 50MB (for image uploads)
```

### **Environment Variables Required**

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/24car-rental
# or MongoDB Atlas connection string

# Server
PORT=4000

# Payment Gateway
ZWITCH_API_KEY=your_zwitch_api_key
ZWITCH_SECRET_KEY=your_zwitch_secret_key
ZWITCH_BASE_URL=https://api.zwitch.io

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# OTP Service (Twilio/MSG91)
OTP_API_KEY=your_otp_service_key
OTP_SENDER_ID=your_sender_id

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 📝 API Response Formats

### **Success Response**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### **Error Response**

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### **Pagination**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 🔍 Query Parameters

### **Common Filters**

```javascript
GET /api/bookings?status=active&driverPhone=9876543210
GET /api/vehicles?category=Car&status=available
GET /api/expenses?vehicleId=12345&startDate=2025-01-01
GET /api/driver-plan-selections?status=active&manager=MGR001
```

### **Sorting & Pagination**

```javascript
?page=1&limit=20
?sortBy=createdAt&order=desc
?search=swift
```

---

## 📞 Support & Maintenance

### **Ticket System**

```javascript
POST /api/tickets
{
  "title": "Issue with vehicle",
  "description": "Detailed description",
  "priority": "high",
  "createdBy": "driverId",
  "category": "vehicle_issue"
}

Response: Ticket ID for tracking
```

### **Logging & Monitoring**

```
Console Logs: All API requests logged
Error Tracking: Errors logged with stack trace
Database Logs: MongoDB query logs
Payment Logs: Zwitch transaction logs
```

---

## 🎉 Conclusion

This is a **complete B2B driver-focused vehicle rental platform** with:

✅ **Driver Management** - Signup, verification, earnings tracking  
✅ **Vehicle Management** - Inventory, pricing, availability  
✅ **Booking System** - Complete rental lifecycle management  
✅ **Payment Integration** - Zwitch gateway for seamless transactions  
✅ **Subscription Plans** - Daily, weekly, monthly driver plans  
✅ **Wallet System** - Driver wallet for balance tracking  
✅ **Expense Tracking** - Vehicle profitability analysis  
✅ **Support System** - Ticket-based customer support  
✅ **Analytics Dashboard** - Real-time business metrics

**Total API Endpoints**: 85+  
**Database Models**: 15  
**Authentication**: JWT + OTP  
**Payment Gateway**: Zwitch

---

**For API testing, use the Postman collection at**: `/backend/POSTMAN_COLLECTION.json`  
**For detailed API docs, see**: `/backend/API_DOCUMENTATION.md`

---

_Last Updated: December 9, 2025_
