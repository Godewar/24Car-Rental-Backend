import mongoose from "mongoose";
import dotenv from "dotenv";
import Vehicle from "../models/vehicle.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in environment");
  process.exit(1);
}

// Sample vehicle data with locations (Delhi NCR coordinates)
const sampleVehicles = [
  {
    registrationNumber: "DL01AB1111",
    category: "Car",
    vehicleName: "Honda City VX",
    brand: "Honda",
    model: "City",
    year: 2022,
    fuelType: "Petrol",
    color: "White",
    ownerName: "Test Owner 1",
    ownerPhone: "9876543210",
    status: "active",
    kycStatus: "verified",
    isAvailable: true,
    currentLocation: {
      type: "Point",
      coordinates: [77.209, 28.6139], // Connaught Place, Delhi
      address: "Connaught Place, Central Delhi",
      city: "New Delhi",
      state: "Delhi",
      lastUpdated: new Date(),
    },
    serviceArea: "Delhi NCR",
    manufactureYear: 2022,
  },
  {
    registrationNumber: "DL02CD2222",
    category: "Bike",
    vehicleName: "Royal Enfield Classic 350",
    brand: "Royal Enfield",
    model: "Classic 350",
    year: 2023,
    fuelType: "Petrol",
    color: "Black",
    ownerName: "Test Owner 2",
    ownerPhone: "9876543211",
    status: "active",
    kycStatus: "verified",
    isAvailable: true,
    currentLocation: {
      type: "Point",
      coordinates: [77.2167, 28.6358], // Karol Bagh, Delhi
      address: "Karol Bagh, West Delhi",
      city: "New Delhi",
      state: "Delhi",
      lastUpdated: new Date(),
    },
    serviceArea: "Delhi NCR",
    manufactureYear: 2023,
  },
  {
    registrationNumber: "DL03EF3333",
    category: "Scooty",
    vehicleName: "Honda Activa 6G",
    brand: "Honda",
    model: "Activa 6G",
    year: 2023,
    fuelType: "Petrol",
    color: "Red",
    ownerName: "Test Owner 3",
    ownerPhone: "9876543212",
    status: "active",
    kycStatus: "verified",
    isAvailable: true,
    currentLocation: {
      type: "Point",
      coordinates: [77.2295, 28.6562], // Chandni Chowk, Delhi
      address: "Chandni Chowk, Old Delhi",
      city: "New Delhi",
      state: "Delhi",
      lastUpdated: new Date(),
    },
    serviceArea: "Delhi NCR",
    manufactureYear: 2023,
  },
  {
    registrationNumber: "DL04GH4444",
    category: "Car",
    vehicleName: "Maruti Swift VXI",
    brand: "Maruti Suzuki",
    model: "Swift",
    year: 2021,
    fuelType: "Petrol",
    color: "Blue",
    ownerName: "Test Owner 4",
    ownerPhone: "9876543213",
    status: "active",
    kycStatus: "verified",
    isAvailable: true,
    currentLocation: {
      type: "Point",
      coordinates: [77.1025, 28.7041], // Rohini, Delhi
      address: "Rohini Sector 10, North West Delhi",
      city: "New Delhi",
      state: "Delhi",
      lastUpdated: new Date(),
    },
    serviceArea: "Delhi NCR",
    manufactureYear: 2021,
  },
  {
    registrationNumber: "DL05IJ5555",
    category: "Bike",
    vehicleName: "Bajaj Pulsar NS200",
    brand: "Bajaj",
    model: "Pulsar NS200",
    year: 2022,
    fuelType: "Petrol",
    color: "Red",
    ownerName: "Test Owner 5",
    ownerPhone: "9876543214",
    status: "active",
    kycStatus: "verified",
    isAvailable: true,
    currentLocation: {
      type: "Point",
      coordinates: [77.275, 28.5494], // Nehru Place, Delhi
      address: "Nehru Place, South Delhi",
      city: "New Delhi",
      state: "Delhi",
      lastUpdated: new Date(),
    },
    serviceArea: "Delhi NCR",
    manufactureYear: 2022,
  },
  {
    registrationNumber: "DL06KL6666",
    category: "Scooty",
    vehicleName: "TVS Jupiter",
    brand: "TVS",
    model: "Jupiter",
    year: 2023,
    fuelType: "Petrol",
    color: "Grey",
    ownerName: "Test Owner 6",
    ownerPhone: "9876543215",
    status: "active",
    kycStatus: "verified",
    isAvailable: true,
    currentLocation: {
      type: "Point",
      coordinates: [77.391, 28.5355], // Noida Sector 18
      address: "Sector 18, Noida",
      city: "Noida",
      state: "Uttar Pradesh",
      lastUpdated: new Date(),
    },
    serviceArea: "Delhi NCR",
    manufactureYear: 2023,
  },
];

async function seedLocationData() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get the latest vehicleId
    const latestVehicle = await Vehicle.findOne({}).sort({ vehicleId: -1 });
    let nextVehicleId = (latestVehicle?.vehicleId || 0) + 1;

    console.log(
      `\n📍 Adding ${sampleVehicles.length} vehicles with location data...\n`
    );

    for (const vehicleData of sampleVehicles) {
      // Check if vehicle already exists
      const existing = await Vehicle.findOne({
        registrationNumber: vehicleData.registrationNumber,
      });

      if (existing) {
        console.log(
          `⚠️  Vehicle ${vehicleData.registrationNumber} already exists, updating location...`
        );
        existing.currentLocation = vehicleData.currentLocation;
        existing.isAvailable = vehicleData.isAvailable;
        existing.serviceArea = vehicleData.serviceArea;
        existing.status = vehicleData.status;
        await existing.save();
        console.log(
          `✅ Updated ${vehicleData.registrationNumber} - ${vehicleData.vehicleName}`
        );
      } else {
        // Create new vehicle
        const vehicle = new Vehicle({
          ...vehicleData,
          vehicleId: nextVehicleId++,
        });
        await vehicle.save();
        console.log(
          `✅ Created ${vehicle.registrationNumber} - ${vehicle.vehicleName} (ID: ${vehicle.vehicleId})`
        );
      }
    }

    console.log("\n🎉 Sample vehicles with locations added successfully!");
    console.log("\n📋 Quick Test Commands:");
    console.log("━".repeat(80));

    console.log("\n1️⃣  Search nearby vehicles (Connaught Place):");
    console.log(
      '   curl "http://localhost:4000/api/vehicles/nearby?latitude=28.6139&longitude=77.2090&maxDistance=5000"'
    );

    console.log("\n2️⃣  Estimate fare (CP to Rohini):");
    console.log(
      "   curl -X POST http://localhost:4000/api/bookings/estimate-fare \\"
    );
    console.log('     -H "Content-Type: application/json" \\');
    console.log(
      '     -d \'{"pickupLat":28.6139,"pickupLon":77.2090,"dropoffLat":28.7041,"dropoffLon":77.1025}\''
    );

    console.log("\n3️⃣  Search vehicles by category:");
    console.log(
      '   curl "http://localhost:4000/api/vehicles/search?category=Car&status=active"'
    );

    console.log("\n4️⃣  Create a booking:");
    console.log("   curl -X POST http://localhost:4000/api/bookings \\");
    console.log('     -H "Content-Type: application/json" \\');
    console.log(
      '     -d \'{"customerName":"Test User","customerPhone":"9876543210","vehicleId":1,'
    );
    console.log(
      '          "pickupLocation":{"coordinates":[77.2090,28.6139],"address":"CP, Delhi"},'
    );
    console.log(
      '          "dropoffLocation":{"coordinates":[77.1025,28.7041],"address":"Rohini, Delhi"}}\''
    );

    console.log("\n━".repeat(80));
    console.log(
      "\n💡 All vehicles are marked as available with verified KYC status"
    );
    console.log(
      "💡 Locations are set across Delhi NCR for testing proximity search"
    );
    console.log("💡 Remember to start your backend server: npm start\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB\n");
  }
}

seedLocationData();
