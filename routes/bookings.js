import express from "express";
import * as bookingController from "../controllers/bookingController.js";

const router = express.Router();

// Price estimation
router.post("/estimate-price", bookingController.estimatePrice);

// Search vehicles
router.post("/search-vehicles", bookingController.searchVehicles);

// Stats (must come before /:id)
router.get("/stats/overview", bookingController.getBookingStats);

// CRUD operations
router.post("/", bookingController.createBooking);
router.get("/", bookingController.getAllBookings);
router.get("/:id", bookingController.getBookingById);

// Status management
router.patch("/:id/status", bookingController.updateBookingStatus);

// Booking lifecycle
router.post("/:id/pickup", bookingController.processPickup);
router.post("/:id/return", bookingController.processReturn);
router.post("/:id/extend", bookingController.extendBooking);
router.post("/:id/cancel", bookingController.cancelBooking);
router.post("/:id/rate", bookingController.rateBooking);

export default router;
