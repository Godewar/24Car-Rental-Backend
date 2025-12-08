import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/vehicle.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixVehicleIndexes() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const collection = Vehicle.collection;

    // Get all indexes
    console.log('Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}.`, JSON.stringify(index.key), index.name);
    });

    // Check for problematic subType index
    const subTypeIndex = indexes.find(idx => idx.key.subType !== undefined);
    
    if (subTypeIndex) {
      console.log('\n❌ Found problematic subType index:', subTypeIndex.name);
      console.log('Removing subType index...');
      
      try {
        await collection.dropIndex(subTypeIndex.name);
        console.log('✅ Successfully removed subType index');
      } catch (dropError) {
        console.log('⚠️ Could not drop index:', dropError.message);
        
        // Alternative: try to drop by key pattern
        try {
          await collection.dropIndex({ subType: 1 });
          console.log('✅ Successfully removed subType index by key pattern');
        } catch (alternateError) {
          console.log('❌ Failed to drop index:', alternateError.message);
        }
      }
    } else {
      console.log('✅ No subType index found - this is good!');
    }

    // List final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}.`, JSON.stringify(index.key), index.name);
    });

    await mongoose.disconnect();
    console.log('\n🎉 Index cleanup completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixVehicleIndexes();