Vendor Panel Logic

## Order Acceptance
- Upon receiving an order, Vendor selects delivery time from default list (**10min, 20min, 30min, 45min**) *simultaneously* while clicking **"Accept"**.

## Dashboard Features
**Live Orders:**
- Display: Customer **Name, Phone, Email, Geo-location, Items**
- **Status Toggles:** In Making → In Delivery → Completed
- Buttons: **"Chat"** (for customers), **"Share"** (export to WhatsApp/3rd-party apps)

**Tiffin View:**
- Dedicated section for assigned tiffin orders
- Show: Upcoming schedules, customer details, confirmation buttons


Admin Panel Logic

## Order Control
- **"Preview Mode"** for all live and past orders
- **"Full Access":** Override and manually **assign/re-assign** any order to any vendor

## Management
- Modules for **Vendor ID** creation, updates, deletion

## Financials
- **Order History tab:** Calculating **total revenue** from past orders

## Catering
- Direct communication interface with customers
- Status update tracking for large events

## Master Tiffin Management
**Planning:**
- View customer's **whole-month tiffin plan** organized **Day-to-Day and Shift-to-Shift** (Morning, Afternoon, Night)

**Execution:**
- Admin edit customer orders
- Assign to vendors
- Share plan details with vendors to avoid miscommunication



Tiffin Order Specifics (Data Points)

The logic handles **single customer sharing multiple details** within one plan:

**Frequency:** 1, 2, or 3 times per day (**Morning, Afternoon, Night**)

**Menu Logic:** Filter by **Veg, Non-Veg, Both, Dessert, or Beverage**, mapped to **Date + Shift**

**Logistics:** Every tiffin entry includes **specific Delivery Address + Geo-location**

**Admin Tracking:** View by **"Customer Wise," "Upcoming," and "Vendor Assigned"** status
