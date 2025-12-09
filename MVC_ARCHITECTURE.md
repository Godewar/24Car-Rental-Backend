# MVC Architecture Implementation Guide

## Project Structure

```
backend/
├── controllers/          # Business logic layer
│   ├── authController.js
│   ├── driverController.js
│   ├── vehicleController.js
│   ├── bookingController.js
│   ├── paymentController.js
│   ├── expenseController.js
│   ├── transactionController.js
│   ├── ticketController.js
│   └── dashboardController.js
├── models/              # Data layer (Mongoose schemas)
│   ├── user.js
│   ├── driver.js
│   ├── driverSignup.js
│   ├── vehicle.js
│   ├── booking.js
│   ├── expense.js
│   ├── transaction.js
│   └── ticket.js
├── routes/              # API routes layer
│   ├── api.js           # Main route aggregator
│   ├── auth.js
│   ├── drivers.js
│   ├── vehicles.js
│   ├── bookings.js
│   ├── payments.js
│   ├── expenses.js
│   ├── transactions.js
│   └── tickets.js
├── middlewares/         # Middleware functions
│   ├── auth.js          # Authentication middleware
│   ├── validation.js    # Request validation
│   └── errorHandler.js  # Error handling
├── lib/                 # Utility functions
│   ├── cloudinary.js    # File upload service
│   ├── emailService.js  # Email service
│   └── fareCalculator.js
├── db.js                # Database connection
└── server.js            # Application entry point
```

## MVC Pattern Explanation

### Model (Data Layer)

- Located in `/models`
- Defines Mongoose schemas and models
- Handles data validation
- Database operations (CRUD)

**Example:**

```javascript
// models/driver.js
import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  status: { type: String, default: "active" },
});

export default mongoose.model("Driver", DriverSchema);
```

### Controller (Business Logic Layer)

- Located in `/controllers`
- Contains business logic for each feature
- Processes requests
- Interacts with models
- Sends responses
- Each controller handles one resource/feature

**Example:**

```javascript
// controllers/driverController.js
import Driver from "../models/driver.js";

export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().lean();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching drivers" });
  }
};
```

### Routes (Presentation Layer)

- Located in `/routes`
- Defines API endpoints
- Maps URLs to controller methods
- Applies middleware
- No business logic - only routing

**Example:**

```javascript
// routes/drivers.js
import express from "express";
import {
  getAllDrivers,
  getDriverById,
} from "../controllers/driverController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticate, getAllDrivers);
router.get("/:id", authenticate, getDriverById);

export default router;
```

## Implementation Guidelines

### 1. Controllers

Controllers should:

- Have descriptive function names
- Include JSDoc comments
- Handle errors properly
- Return consistent response formats
- Not contain routing logic

**Controller Template:**

```javascript
/**
 * @desc    Description of what this function does
 * @route   HTTP_METHOD /api/resource/path
 * @access  Public/Private
 */
export const functionName = async (req, res) => {
  try {
    // 1. Extract data from request
    const { param } = req.params;
    const { body } = req.body;

    // 2. Perform business logic
    const result = await Model.someOperation();

    // 3. Validate results
    if (!result) {
      return res.status(404).json({ message: "Not found" });
    }

    // 4. Send response
    res.json(result);
  } catch (error) {
    console.error("Error description:", error);
    res.status(500).json({
      message: "User-friendly error message",
      error: error.message,
    });
  }
};
```

### 2. Routes

Routes should:

- Be RESTful
- Use appropriate HTTP methods
- Group related endpoints
- Apply middleware where needed
- Import controller functions

**RESTful Route Patterns:**

```javascript
// CRUD operations
GET     /api/drivers          → getAllDrivers
GET     /api/drivers/:id      → getDriverById
POST    /api/drivers          → createDriver
PUT     /api/drivers/:id      → updateDriver
DELETE  /api/drivers/:id      → deleteDriver

// Nested resources
GET     /api/drivers/:id/vehicles    → getDriverVehicles
POST    /api/drivers/:id/vehicles    → assignVehicle

// Actions
POST    /api/drivers/:id/activate    → activateDriver
POST    /api/drivers/:id/suspend     → suspendDriver
```

### 3. Middlewares

Common middleware types:

- **Authentication:** Verify user identity
- **Authorization:** Check user permissions
- **Validation:** Validate request data
- **Error Handling:** Catch and format errors

**Middleware Template:**

```javascript
// middlewares/auth.js
export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
```

## Response Format Standards

### Success Response

```javascript
// Single item
{
  "id": 1,
  "name": "John Doe",
  "status": "active"
}

// Multiple items
[
  { "id": 1, "name": "John" },
  { "id": 2, "name": "Jane" }
]

// With metadata
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### Error Response

```javascript
{
  "message": "User-friendly error message",
  "error": "Technical error details" // optional in production
}
```

## Migration Checklist

- [x] Create `/controllers` directory
- [x] Create `/middlewares` directory
- [x] Implement `driverController.js`
- [x] Implement `authController.js`
- [x] Update `routes/drivers.js` to use controller
- [x] Update `routes/auth.js` to use controller
- [ ] Implement `vehicleController.js`
- [ ] Implement `bookingController.js`
- [ ] Implement `paymentController.js`
- [ ] Implement `expenseController.js`
- [ ] Update remaining route files
- [ ] Create authentication middleware
- [ ] Create validation middleware
- [ ] Create error handling middleware
- [ ] Test all endpoints

## Benefits of MVC Architecture

1. **Separation of Concerns:** Each layer has a specific responsibility
2. **Maintainability:** Easy to locate and fix bugs
3. **Testability:** Each layer can be tested independently
4. **Scalability:** Easy to add new features
5. **Code Reusability:** Controllers can be reused across different routes
6. **Team Collaboration:** Multiple developers can work on different layers

## Next Steps

1. Continue implementing controllers for:

   - Vehicles
   - Bookings
   - Payments
   - Expenses
   - Transactions
   - Tickets

2. Create middleware for:

   - Authentication (JWT verification)
   - Request validation
   - Error handling

3. Update all route files to use controllers

4. Add API documentation (Swagger/OpenAPI)

5. Implement unit tests for controllers
