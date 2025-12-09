# 🚀 Customer → Driver Migration Quick Start

## TL;DR

Your platform has been updated from customer rentals to driver-only rentals. Run these commands to complete the migration:

```bash
# 1. Navigate to backend
cd /Users/macos/Downloads/24CarRental/backend

# 2. Run database migration
node scripts/migrateCustomerToDriver.mjs

# 3. Verify changes
node scripts/checkIndexes.mjs

# 4. Start server
npm run dev
```

---

## 📋 Pre-Migration Checklist

- [ ] Backup your MongoDB database
- [ ] Ensure backend dependencies are installed (`npm install`)
- [ ] Verify MongoDB connection string in `.env`
- [ ] Stop any running backend servers

---

## 🔧 Step-by-Step Migration

### Step 1: Backup Database (CRITICAL!)

```bash
# Export current bookings collection
mongodump --uri="your_mongodb_uri" --collection=bookings --out=./backup

# Or if local MongoDB:
mongodump --db=24car-rental --collection=bookings --out=./backup
```

### Step 2: Install Dependencies

```bash
cd /Users/macos/Downloads/24CarRental/backend
npm install
```

### Step 3: Run Migration Script

```bash
node scripts/migrateCustomerToDriver.mjs
```

**Expected Output**:

```
🚀 BOOKING MODEL MIGRATION: CUSTOMER → DRIVER
==================================================

✅ Connected to MongoDB
📊 Total bookings found: 150
✅ Modified 150 booking documents
✅ Updated 12 cancellation records
✅ Dropped old indexes
✅ Created new indexes
✅ Migration verified successfully!

🎉 MIGRATION COMPLETED SUCCESSFULLY!
```

### Step 4: Verify Migration

```bash
# Check that new indexes were created
node scripts/checkIndexes.mjs
```

Should show:

- `driverId_1` ✅
- `driverPhone_1` ✅

### Step 5: Test APIs

```bash
# Start server
npm run dev

# In another terminal, test booking creation:
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "driverName": "Test Driver",
    "driverPhone": "+919999999999",
    "driverEmail": "test@example.com",
    "vehicleId": "67abc123...",
    "pickupDate": "2024-12-25T10:00:00Z",
    "returnDate": "2024-12-30T10:00:00Z"
  }'
```

---

## ⚠️ Troubleshooting

### Error: "Cannot connect to MongoDB"

```bash
# Check your .env file has correct MongoDB URI
cat .env | grep MONGODB_URI

# Test connection
mongosh "your_mongodb_uri"
```

### Error: "customerId index already exists"

```bash
# Manually drop old indexes
mongosh "your_mongodb_uri" --eval '
  db.bookings.dropIndex("customerId_1");
  db.bookings.dropIndex("customerPhone_1");
'

# Run migration again
node scripts/migrateCustomerToDriver.mjs
```

### Error: "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Migration Runs But No Changes

- Check MongoDB URI is correct
- Verify you're connected to the right database
- Check if bookings collection exists: `db.bookings.countDocuments()`

---

## 🧪 Testing Checklist

After migration, test these scenarios:

### ✅ Create Booking

```bash
POST /api/bookings
Body: { driverName, driverPhone, driverEmail, driverAge, vehicleId, ... }
Expected: 201 Created with driverId field
```

### ✅ Get Bookings by Driver

```bash
GET /api/bookings?driverPhone=+919999999999
Expected: 200 OK with array of driver's bookings
```

### ✅ Rate Booking

```bash
POST /api/bookings/:id/rate
Body: { overall, vehicleCondition, cleanliness, service, value, feedback }
Expected: 200 OK with driverRating saved
```

### ✅ Cancel Booking

```bash
POST /api/bookings/:id/cancel
Body: { reason, cancelledBy: "driver" }
Expected: 200 OK with cancellation saved
```

---

## 📊 What Changed?

### Field Mapping

| Old Field        | New Field      |
| ---------------- | -------------- |
| `customerId`     | `driverId`     |
| `customerName`   | `driverName`   |
| `customerPhone`  | `driverPhone`  |
| `customerEmail`  | `driverEmail`  |
| `customerAge`    | `driverAge`    |
| `customerRating` | `driverRating` |

### Business Model Change

**Before**: Consumer rental platform (like ZoomCar)

- Individuals rent cars for personal trips
- Short-term rentals (hours/days)
- B2C market

**After**: Driver-focused platform

- Commercial drivers rent vehicles for income
- Long-term rentals (weeks/months)
- B2B market (Uber/Ola drivers)

---

## 🔄 Rollback Plan (If Needed)

If migration fails or causes issues:

```bash
# 1. Stop backend server
pkill -f "node.*server.js"

# 2. Restore from backup
mongorestore --uri="your_mongodb_uri" --drop ./backup

# 3. Revert code changes
cd /Users/macos/Downloads/24CarRental/backend
git checkout HEAD -- models/booking.js controllers/bookingController.js

# 4. Restart server
npm run dev
```

---

## 📞 Need Help?

Check these resources:

1. **Detailed Change Log**: `CUSTOMER_TO_DRIVER_UPDATE.md`
2. **Complete Summary**: `DRIVER_MODEL_MIGRATION_COMPLETE.md`
3. **API Documentation**: `API_DOCUMENTATION.md` (needs update)
4. **Backend Flow**: `COMPLETE_BACKEND_FLOW.md` (needs update)

---

## ✅ Success Criteria

Migration is successful when:

1. ✅ Migration script completes without errors
2. ✅ All bookings have driver* fields (no customer* fields)
3. ✅ New indexes created (driverId, driverPhone)
4. ✅ Old indexes removed (customerId, customerPhone)
5. ✅ API endpoints work with driver fields
6. ✅ No console errors when querying bookings

---

## 🎉 Next Steps

After successful migration:

1. Update frontend to use driver\* field names
2. Update API documentation with new field names
3. Update Postman collection with driver fields
4. Test thoroughly in staging environment
5. Deploy to production during maintenance window

---

**Estimated Time**: 15-30 minutes  
**Difficulty**: Medium  
**Risk Level**: Low (field rename only, no data loss)
