# Quick Reference - Vehicles API

## 🎯 Main Endpoint

```
GET http://localhost:3002/api/vehicles
```

---

## 📊 Response Structure

```json
{
  "success": true,
  "totalVehicles": 9,
  "categories": [
    {
      "name": "Car", // Category: Car, Bike, Scooty
      "totalVehicles": 3,
      "brands": [
        {
          "name": "Honda", // Brand/Subcategory
          "totalVehicles": 1,
          "vehicles": [
            // Individual vehicles
            {
              "vehicleId": 7,
              "vehicleName": "Honda City VX",
              "registrationNumber": "DL01AB1111",
              "model": "City",
              "color": "White",
              "status": "active",
              "isAvailable": false,
              "fullDetails": {
                /* complete data */
              }
            }
          ]
        }
      ]
    }
  ],
  "summary": {
    "totalCategories": 3,
    "categoryCounts": { "Bike": 3, "Car": 3, "Scooty": 3 },
    "totalBrands": 7
  }
}
```

---

## 🔍 Current Data

### Cars (3 vehicles, 2 brands)

- **Maruti Suzuki** (2): Baleno, Swift VXI
- **Honda** (1): City VX

### Bikes (3 vehicles, 3 brands)

- **Honda** (1): Shine
- **Royal Enfield** (1): Classic 350
- **Bajaj** (1): Pulsar NS200

### Scooties (3 vehicles, 2 brands)

- **Honda** (2): Activa, Activa 6G
- **TVS** (1): Jupiter

---

## 💡 Common Queries

### Get all organized

```bash
curl http://localhost:3002/api/vehicles
```

### Get flat list (legacy)

```bash
curl http://localhost:3002/api/vehicles?flat=true
```

### Get only Cars

```bash
curl http://localhost:3002/api/vehicles | \
  jq '.categories[] | select(.name == "Car")'
```

### Get only Honda vehicles

```bash
curl http://localhost:3002/api/vehicles | \
  jq '.categories[] | {
    category: .name,
    honda: (.brands[] | select(.name == "Honda"))
  } | select(.honda != null)'
```

### Get summary only

```bash
curl http://localhost:3002/api/vehicles | \
  jq '{totalVehicles, summary}'
```

---

## 🎨 Frontend Usage

```javascript
// React/Next.js
const response = await fetch("http://localhost:3002/api/vehicles");
const data = await response.json();

// Access structure:
data.categories.forEach((category) => {
  console.log(`Category: ${category.name}`);

  category.brands.forEach((brand) => {
    console.log(`  Brand: ${brand.name}`);

    brand.vehicles.forEach((vehicle) => {
      console.log(`    Vehicle: ${vehicle.vehicleName}`);
    });
  });
});
```

---

## ✨ Features

✅ **Hierarchical**: Category → Brand → Vehicle  
✅ **Statistics**: Counts at every level  
✅ **Full Details**: Complete vehicle data included  
✅ **Backward Compatible**: `?flat=true` for legacy format  
✅ **Frontend Ready**: Direct mapping to UI components

---

## 📚 Documentation

- **Complete Guide**: `/backend/ORGANIZED_VEHICLES_API.md`
- **Project Flow**: `/backend/COMPLETE_PROJECT_FLOW.md`
- **Brand Filter**: `/backend/BRAND_FILTER_FEATURE.md`

---

**Last Updated**: December 9, 2025  
**Server**: http://localhost:3002
