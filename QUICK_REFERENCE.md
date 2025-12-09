# 🚗 ZoomCar Backend - Quick Reference

## 🎯 What is This?

**Self-drive vehicle rental backend** (like ZoomCar) - NOT ride-hailing (Ola/Uber).

---

## 📦 Rental Packages

| Package     | Car       | Bike      | Scooty    |
| ----------- | --------- | --------- | --------- |
| **Hourly**  | ₹150/hr   | ₹80/hr    | ₹60/hr    |
| **Daily**   | ₹2500/day | ₹800/day  | ₹600/day  |
| **Weekly**  | ₹15K/wk   | ₹4800/wk  | ₹3600/wk  |
| **Monthly** | ₹45K/mo   | ₹14.4K/mo | ₹10.8K/mo |

**Security Deposits:** Car: ₹5K, Bike: ₹2K, Scooty: ₹1.5K

---

## 🚀 Quick Test

### 1. Start Server

```bash
cd backend && node server.js
```

### 2. Get Price Estimate

```bash
curl -X POST http://localhost:3002/api/bookings/estimate-price \
  -H "Content-Type: application/json" \
  -d '{"pickupDate":"2025-12-25T10:00:00Z","returnDate":"2025-12-28T10:00:00Z"}'
```

### 3. Create Booking

```bash
curl -X POST http://localhost:3002/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName":"Rahul Kumar",
    "customerPhone":"9876543210",
    "customerEmail":"rahul@example.com",
    "customerAge":28,
    "vehicleId":10,
    "pickupDate":"2025-12-25T10:00:00Z",
    "returnDate":"2025-12-28T10:00:00Z"
  }'
```

---

## 📋 All Endpoints

### Pricing & Search

- `POST /api/bookings/estimate-price` - Get pricing
- `POST /api/bookings/search-vehicles` - Find available vehicles

### Booking CRUD

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings (filters: status, phone, category, dates)
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/status` - Update status

### Rental Flow

- `POST /api/bookings/:id/pickup` - Vehicle pickup
- `POST /api/bookings/:id/return` - Vehicle return (calculates charges)
- `POST /api/bookings/:id/extend` - Extend rental
- `POST /api/bookings/:id/cancel` - Cancel (calculates refund)

### Reviews & Stats

- `POST /api/bookings/:id/rate` - Submit rating
- `GET /api/bookings/stats/overview` - Statistics

---

## 📊 Booking Status Flow

```
pending_verification → confirmed → vehicle_ready → active → completed
```

---

## 💰 Pricing Components

- **Base Rent** - Package rate (hourly/daily/weekly/monthly)
- **Insurance** - Basic (free), Comprehensive (+₹500), Zero Deductible (+₹1000)
- **Extras** - GPS (₹100), Child Seat (₹200), Additional Driver (₹500)
- **Platform Fee** - ₹100
- **GST** - 5% on subtotal
- **Security Deposit** - ₹1500-₹5000 (refundable)

---

## ⚠️ Charges & Penalties

### Extra KM

- Car: ₹8/km, Bike: ₹5/km, Scooty: ₹4/km

### Late Return

- Hourly: ₹50-₹100/hr (based on category)
- Daily+: Per-day charges

### Cancellation

- > 72hrs: Free
- 48-72hrs: 25% fee
- 24-48hrs: 50% fee
- <24hrs: 75% fee
- After pickup: 100% fee

---

## 📁 Key Files

### Models

- `/backend/models/booking.js` - Rental booking schema

### Business Logic

- `/backend/lib/rentalPricing.js` - Pricing calculator

### Routes

- `/backend/routes/bookings.js` - 12 API endpoints

### Documentation

- `/backend/RENTAL_API_GUIDE.md` - Complete guide (9000+ words)
- `/backend/IMPLEMENTATION_SUMMARY.md` - Implementation details

---

## 🗄️ Test Data

**Vehicles:** vehicleIds 7-12 (Delhi NCR)

- 7: Honda City (Car) - Connaught Place
- 8: Royal Enfield (Bike) - Karol Bagh
- 9: Honda Activa (Scooty) - Chandni Chowk
- 10: Maruti Swift (Car) - Rohini
- 11: Bajaj Pulsar (Bike) - Nehru Place
- 12: TVS Jupiter (Scooty) - Noida

---

## 🔧 Common Issues

### "Pickup date cannot be in the past"

Use future dates: `2025-12-25T10:00:00Z` (not 2024)

### "Vehicle not available"

Check `isAvailable` flag and existing bookings for date conflict

### "Cannot find module"

Make sure you're in `/backend` directory

---

## 📞 URLs

- **Server:** http://localhost:3002
- **API Base:** http://localhost:3002/api/bookings
- **Database:** MongoDB (check `.env` for MONGODB_URI)

---

## ✅ What Works

✓ Price estimation (all categories)  
✓ Vehicle search (location + dates)  
✓ Booking creation  
✓ Status management  
✓ Pickup/return workflow  
✓ Extra KM calculation  
✓ Late return charges  
✓ Cancellation refunds  
✓ Extension requests  
✓ Customer ratings  
✓ Admin statistics

---

## 🎯 Key Differences: ZoomCar vs Ola

| Feature   | ZoomCar          | Ola             |
| --------- | ---------------- | --------------- |
| Driver    | Self-drive       | Driver-assigned |
| Pricing   | Time-based       | Distance-based  |
| Duration  | Hours-months     | Minutes-hours   |
| Documents | License required | Not required    |
| Deposit   | ₹1500-₹5000      | None            |
| Location  | Fixed stations   | Dynamic         |

---

## 📚 More Info

See **RENTAL_API_GUIDE.md** for:

- Detailed API documentation
- Request/response examples
- Business model explanation
- Integration guidelines
- Frontend requirements

---

**Happy Renting! 🚗💨**
