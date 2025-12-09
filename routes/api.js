import driverWalletRouter from "./driverWallet.js";

import driverWalletMessageRouter from "./driverWalletMessage.js";

import express from "express";
import authRouter from "./auth.js";
import driversRouter from "./drivers.js";
import driverAuthRouter from "./driverAuth.js";
import driverPlanSelectionsRouter from "./driverPlanSelections.js";
import vehiclesRouter from "./vehicles.js";
import vehiclesByDriverRouter from "./vehiclesByDriver.js";
import bookingsRouter from "./bookings.js";
import driverPlansRouter from "./driverPlans.js";
import transactionsRouter from "./transactions.js";
import ticketsRouter from "./tickets.js";
import employeesRouter from "./employees.js";
import dashboardRouter from "./dashboard.js";
import carPlansRouter from "./carPlans.js";
import weeklyRentPlansRouter from "./weeklyRentPlans.js";
import dailyRentPlansRouter from "./dailyRentPlans.js";
import expensesRouter from "./expenses.js";
import vehicleOptionsRouter from "./vehicleOptions.js";
import staticDriverEnrollmentsRouter from "./staticDriverEnrollments.js";
import paymentsRouter from "./payments.js";
import managersRouter from "./managers.js";

const router = express.Router();
router.use("/driver-wallet", driverWalletRouter);
router.use("/driver-wallet-message", driverWalletMessageRouter);
router.use("/auth", authRouter);
router.use("/drivers", driversRouter);
router.use("/drivers", driverAuthRouter);
router.use("/driver-plan-selections", driverPlanSelectionsRouter);
router.use("/vehicles", vehiclesRouter);
router.use("/vehicles-by-driver", vehiclesByDriverRouter);
router.use("/bookings", bookingsRouter);
router.use("/driver-plans", driverPlansRouter);
router.use("/transactions", transactionsRouter);
router.use("/tickets", ticketsRouter);
router.use("/employees", employeesRouter);
router.use("/dashboard", dashboardRouter);
router.use("/car-plans", carPlansRouter);
router.use("/weekly-rent-plans", weeklyRentPlansRouter);
router.use("/daily-rent-plans", dailyRentPlansRouter);
router.use("/expenses", expensesRouter);
router.use("/vehicle-options", vehicleOptionsRouter);
router.use("/static/driver-enrollments", staticDriverEnrollmentsRouter);
router.use("/payments", paymentsRouter);

// Manager routes
router.use("/managers", managersRouter);

export default router;
