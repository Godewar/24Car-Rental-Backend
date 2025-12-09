import express from "express";
import * as vehicleController from "../controllers/vehicleController.js";

const router = express.Router();

// Vehicle categories
router.get("/categories", vehicleController.getCategories);

// Filter vehicles by category with pagination
router.get("/by-category/:category", vehicleController.getVehiclesByCategory);

// Nearby vehicles based on geolocation
router.get("/nearby", vehicleController.getNearbyVehicles);

// Search/filter vehicles
router.get("/search", vehicleController.searchVehicles);

// Weekly rent slabs (must come before /:id)
router.get("/:id/weekly-rent-slabs", vehicleController.getWeeklyRentSlabs);
router.put("/:id/weekly-rent-slabs", vehicleController.updateWeeklyRentSlabs);

// Daily rent slabs (must come before /:id)
router.get("/:id/daily-rent-slabs", vehicleController.getDailyRentSlabs);
router.put("/:id/daily-rent-slabs", vehicleController.updateDailyRentSlabs);

// Monthly profit (must come before /:id)
router.get("/:id/monthly-profit", vehicleController.getMonthlyProfit);

// CRUD operations
router.get("/", vehicleController.getAllVehicles);
router.get("/:id", vehicleController.getVehicleById);

router.post("/", vehicleController.createVehicle);
router.put("/:id", vehicleController.updateVehicle);
router.delete("/:id", vehicleController.deleteVehicle);

export default router;
