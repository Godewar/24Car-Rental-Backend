/**
 * MongoDB Migration Script
 * Customer → Driver Field Rename
 *
 * This script migrates existing booking data from customer-based fields
 * to driver-based fields.
 *
 * Run this script ONCE before deploying the updated backend.
 */

import mongoose from "mongoose";
import "dotenv/config";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/24car-rental";

async function migrateCustomerToDriver() {
  try {
    console.log("🔄 Starting Customer → Driver Migration...\n");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;
    const bookingsCollection = db.collection("bookings");

    // Step 1: Count existing bookings
    const totalCount = await bookingsCollection.countDocuments({});
    console.log(`📊 Total bookings found: ${totalCount}\n`);

    if (totalCount === 0) {
      console.log("✅ No bookings to migrate. Database is clean.\n");
      await mongoose.connection.close();
      return;
    }

    // Step 2: Rename customer fields to driver fields
    console.log("🔄 Renaming fields from customer* to driver*...");

    const renameResult = await bookingsCollection.updateMany(
      {},
      {
        $rename: {
          customerId: "driverId",
          customerName: "driverName",
          customerPhone: "driverPhone",
          customerEmail: "driverEmail",
          customerAge: "driverAge",
          customerRating: "driverRating",
        },
      }
    );

    console.log(
      `✅ Modified ${renameResult.modifiedCount} booking documents\n`
    );

    // Step 3: Update cancellation references
    console.log("🔄 Updating cancellation references...");

    const cancelResult = await bookingsCollection.updateMany(
      { "cancellationDetails.cancelledBy": "customer" },
      {
        $set: { "cancellationDetails.cancelledBy": "driver" },
      }
    );

    console.log(
      `✅ Updated ${cancelResult.modifiedCount} cancellation records\n`
    );

    // Step 4: Drop old indexes
    console.log("🔄 Dropping old customer indexes...");

    try {
      await bookingsCollection.dropIndex("customerId_1");
      console.log("✅ Dropped customerId_1 index");
    } catch (err) {
      console.log("⚠️  customerId_1 index not found (okay if fresh database)");
    }

    try {
      await bookingsCollection.dropIndex("customerPhone_1");
      console.log("✅ Dropped customerPhone_1 index");
    } catch (err) {
      console.log(
        "⚠️  customerPhone_1 index not found (okay if fresh database)"
      );
    }

    // Step 5: Create new driver indexes
    console.log("\n🔄 Creating new driver indexes...");

    await bookingsCollection.createIndex({ driverId: 1 });
    console.log("✅ Created driverId_1 index");

    await bookingsCollection.createIndex({ driverPhone: 1 });
    console.log("✅ Created driverPhone_1 index");

    // Step 6: Verify migration
    console.log("\n🔍 Verifying migration...");

    const sampleBooking = await bookingsCollection.findOne({});

    if (sampleBooking) {
      const hasDriverFields =
        sampleBooking.hasOwnProperty("driverName") &&
        sampleBooking.hasOwnProperty("driverPhone");

      const hasCustomerFields =
        sampleBooking.hasOwnProperty("customerName") ||
        sampleBooking.hasOwnProperty("customerPhone");

      if (hasDriverFields && !hasCustomerFields) {
        console.log("✅ Migration verified successfully!");
        console.log("✅ All bookings now use driver* fields");
      } else if (hasCustomerFields) {
        console.log("⚠️  Warning: Some bookings still have customer* fields");
      } else {
        console.log("✅ No field conflicts found");
      }

      console.log("\n📄 Sample booking structure:");
      console.log({
        bookingId: sampleBooking.bookingId,
        driverName: sampleBooking.driverName,
        driverPhone: sampleBooking.driverPhone,
        driverEmail: sampleBooking.driverEmail,
        vehicleId: sampleBooking.vehicleId,
        status: sampleBooking.status,
      });
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Total bookings: ${totalCount}`);
    console.log(`   - Documents updated: ${renameResult.modifiedCount}`);
    console.log(`   - Cancellations updated: ${cancelResult.modifiedCount}`);
    console.log(`   - Old indexes dropped: 2`);
    console.log(`   - New indexes created: 2`);
    console.log("\n✅ Your database is now ready for the driver-only model!\n");

    await mongoose.connection.close();
    console.log("✅ Database connection closed\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  }
}

// Run migration
console.log("\n" + "=".repeat(60));
console.log("🚀 BOOKING MODEL MIGRATION: CUSTOMER → DRIVER");
console.log("=".repeat(60) + "\n");

migrateCustomerToDriver();
