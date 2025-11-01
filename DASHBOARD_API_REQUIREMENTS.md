# Dashboard API Requirements

## Overview

This document describes the backend API endpoints required by the Dashboard component. The dashboard displays real-time statistics for suppliers, products, sales, and revenue with historical comparison and growth percentages.

---

## Required Endpoints

### 1. **Get Supplier Count**

**Endpoint:** `GET /api/suppliers/count`

**Query Parameters:**

- `search` (string, required): Time period for filtering
  - Possible values: `"day"`, `"week"`, `"month"`, `"year"`

**Response Format:**

```json
{
  "totalCount": 150,
  "success": true
}
```

**Fields:**

- `totalCount` (number): Current total number of suppliers
- `success` (boolean, optional): Operation status

**Description:** Returns the total count of active suppliers. The frontend will automatically calculate the growth percentage by comparing with previous counts stored in Redux state.

---

### 2. **Get Product Count**

**Endpoint:** `GET /api/products/count`

**Query Parameters:**

- `search` (string, required): Time period for filtering
  - Possible values: `"day"`, `"week"`, `"month"`, `"year"`

**Response Format:**

```json
{
  "totalCount": 2543,
  "success": true
}
```

**Fields:**

- `totalCount` (number): Current total number of products
- `success` (boolean, optional): Operation status

**Description:** Returns the total count of products in inventory. The frontend maintains a 30-day history of counts in Redux to calculate trends and growth percentages.

---

### 3. **Get Sales Count**

**Endpoint:** `GET /api/sales/count`

**Query Parameters:**

- `search` (string, required): Time period for filtering
  - Possible values: `"day"`, `"week"`, `"month"`, `"year"`

**Response Format:**

```json
{
  "count": 487,
  "prevCount": 423,
  "success": true
}
```

**Fields:**

- `count` (number): Number of sales in the current period
- `prevCount` (number): Number of sales in the previous period (for comparison)
- `success` (boolean, optional): Operation status

**Description:** Returns the count of completed sales transactions. The backend should calculate and return both current and previous period counts to enable accurate growth percentage calculation.

**Period Comparison Logic:**

- `day`: Compare today vs yesterday
- `week`: Compare this week vs last week
- `month`: Compare this month vs last month
- `year`: Compare this year vs last year

---

### 4. **Get Revenue**

**Endpoint:** `GET /api/sales/revenue`

**Query Parameters:**

- `search` (string, required): Time period for filtering
  - Possible values: `"day"`, `"week"`, `"month"`, `"year"`

**Response Format:**

```json
{
  "totalRevenue": 125340.5,
  "prevTotalRevenue": 98240.75,
  "success": true
}
```

**Fields:**

- `totalRevenue` (number): Total revenue in the current period
- `prevTotalRevenue` (number): Total revenue in the previous period (for comparison)
- `success` (boolean, optional): Operation status

**Description:** Returns the total revenue from sales. Similar to sales count, the backend should provide both current and previous period values.

---

## Data Flow Architecture

### Frontend (Redux State Management)

```
Dashboard Component
    ↓
Redux Store (dashboardSlice)
    ↓
API Service Layer
    ↓
Backend API Endpoints
```

### Redux State Structure

```typescript
{
  dashboard: {
    suppliers: {
      current: number,
      previous: number,
      percentage: string,
      countList: CountListItem[] // Last 30 days
    },
    products: {
      current: number,
      previous: number,
      percentage: string,
      countList: CountListItem[] // Last 30 days
    },
    sales: {
      current: number,
      previous: number,
      percentage: string,
      countList: CountListItem[] // Empty for now
    },
    revenue: {
      current: number,
      previous: number,
      percentage: string,
      countList: CountListItem[] // Empty for now
    },
    timeframe: string, // "day" | "week" | "month" | "year"
    loading: boolean,
    error: string | null
  }
}
```

### CountListItem Structure

```typescript
{
  count: number,
  date: string,        // ISO date format: "YYYY-MM-DD"
  updatedAt: string    // ISO timestamp
}
```

---

## Calculation Details

### Growth Percentage Formula

```
percentage = ((current - previous) / previous) * 100
```

**Special Cases:**

- If `previous = 0` and `current > 0`: Return `100.00%`
- If `previous = 0` and `current = 0`: Return `0.00%`
- If result is NaN: Return `0.00%`

**Frontend Handling:**

- Positive percentages indicate growth (green indicator)
- Negative percentages indicate decline (red indicator)
- All percentages are formatted to 2 decimal places

---

## Historical Data Management

### Suppliers & Products

- Frontend stores up to **30 days** of historical counts
- Each day's count is stored with the date
- Oldest entries are automatically removed when limit is reached
- Data persists in Redux state during the session

### Sales & Revenue

- Frontend uses backend-provided `prevCount` and `prevTotalRevenue`
- No historical tracking on frontend (relies on backend comparison)

---

## Error Handling

All endpoints should handle errors gracefully and return appropriate HTTP status codes:

**Success Response:** `200 OK`

```json
{
  "totalCount": 150,
  "success": true
}
```

**Error Response:** `400/500 with error message`

```json
{
  "success": false,
  "message": "Error fetching supplier count",
  "error": "Database connection failed"
}
```

**Frontend Behavior on Error:**

- Displays error in console
- Sets count to 0
- Shows error message to user (optional)
- Maintains previous state in Redux

---

## Authentication

All endpoints require authentication via JWT token:

**Headers:**

```
Authorization: Bearer <token>
```

The token is automatically added by the API service interceptor from Redux auth state.

---

## Performance Considerations

1. **Caching:** Consider implementing server-side caching for count queries (5-15 minute cache)
2. **Indexing:** Ensure database indexes on date fields and status columns
3. **Aggregation:** Use database aggregation functions for counts and sums
4. **Batch Requests:** Frontend fetches all data in parallel on mount/timeframe change

---

## Testing Endpoints

### Example cURL Commands

```bash
# Get supplier count
curl -X GET "http://localhost:3000/api/suppliers/count?search=month" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get product count
curl -X GET "http://localhost:3000/api/products/count?search=week" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get sales count
curl -X GET "http://localhost:3000/api/sales/count?search=day" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get revenue
curl -X GET "http://localhost:3000/api/sales/revenue?search=year" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Future Enhancements

1. **Real-time Updates:** Consider WebSocket integration for live dashboard updates
2. **Custom Date Ranges:** Allow users to select specific date ranges
3. **Export Data:** Add endpoints to export dashboard data as CSV/PDF
4. **Drill-down:** Provide endpoints for detailed breakdowns by category, region, etc.
5. **Forecasting:** Add predictive analytics based on historical trends

---

## Summary

The Dashboard requires **4 main API endpoints** that provide:

- Current counts/totals for suppliers, products, sales, and revenue
- Previous period comparisons for sales and revenue
- Time-based filtering (day/week/month/year)
- Proper error handling and authentication

All data is managed in Redux state, eliminating the need for localStorage and providing a centralized, type-safe state management solution.
