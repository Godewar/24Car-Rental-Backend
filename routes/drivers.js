import express from "express";
import {
  getAllDrivers,
  getDriverById,
  getDriverByPhone,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverSignupCredentials,
  updateDriverSignupCredential,
  deleteDriverSignupCredential,
  getDriverEarningsSummary,
} from "../controllers/driverController.js";

const router = express.Router();

// Driver signup credentials routes
router.get("/signup/credentials", getDriverSignupCredentials);
router.put("/signup/credentials/:id", updateDriverSignupCredential);
router.delete("/signup/credentials/:id", deleteDriverSignupCredential);

// Driver earnings route
router.get("/earnings/summary", getDriverEarningsSummary);

// Get driver by phone (must come before /:id to avoid conflict)
router.get("/form/mobile/:phone", getDriverByPhone);

// CRUD operations
router.get("/", getAllDrivers);
router.get("/:id", getDriverById);
router.post("/", createDriver);
router.put("/:id", updateDriver);
router.delete("/:id", deleteDriver);

export default router;
