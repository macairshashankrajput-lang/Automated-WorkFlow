# Chakna Store - Mobile App Design Plan

## Overview
A comprehensive multi-service food business platform with role-based access for Customers, Vendors, and Admins. The app supports three main services: Chakna Store (food delivery), Catering Services, and Tiffin Services.

**Design Principles:**
- Mobile-first (portrait orientation, 9:16 aspect ratio)
- One-handed usage friendly
- Apple HIG (Human Interface Guidelines) compliant
- Clean, modern UI with consistent branding

---

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** | #FF6B35 | Buttons, CTAs, highlights (warm orange) |
| **Secondary** | #004E89 | Accents, links (deep blue) |
| **Success** | #22C55E | Confirmations, delivery status |
| **Warning** | #F59E0B | Alerts, pending status |
| **Error** | #EF4444 | Errors, cancellations |
| **Background** | #FFFFFF | Main background (light mode) |
| **Surface** | #F5F5F5 | Cards, containers |
| **Text Primary** | #11181C | Main text |
| **Text Secondary** | #687076 | Secondary text, labels |
| **Border** | #E5E7EB | Dividers, borders |

---

## Screen List & Flows

### 1. Authentication Flow

#### 1.1 Splash Screen
- **Content:** App logo, loading animation
- **Duration:** 2-3 seconds
- **Next:** Check auth state → Login or Home

#### 1.2 Onboarding (Optional)
- **Screens:** 2-3 carousel slides
- **Content:** 
  - Slide 1: "Order Food Anytime" (Chakna Store)
  - Slide 2: "Plan Your Events" (Catering)
  - Slide 3: "Daily Meal Plans" (Tiffin)
- **CTA:** "Get Started" button

#### 1.3 Login Screen
- **Fields:**
  - Email input
  - Password input
  - "Forgot Password?" link
- **Buttons:**
  - "Login" (primary)
  - "Don't have an account? Register" (secondary)
- **Validation:** Email format, password length

#### 1.4 Register Screen
- **Fields:**
  - Full Name
  - Phone Number
  - Email
  - Password (with strength indicator)
  - Confirm Password
  - Delivery Location (Google Maps picker)
  - Referral Code (optional)
- **Role Selection:** Customer / Vendor / Admin (radio buttons)
- **Buttons:**
  - "Create Account" (primary)
  - "Already have an account? Login" (secondary)

---

### 2. Customer Flow

#### 2.1 Customer Home Screen
- **Header:** Greeting + location display
- **Content:**
  - Search bar (search restaurants/items)
  - 3 Service Cards (Chakna Store, Catering, Tiffin)
  - Quick access buttons (Orders, Favorites, Profile)
- **Bottom Navigation:** Home, Orders, Favorites, Profile

#### 2.2 Chakna Store Flow

**2.2.1 Store Listing Page**
- **Content:**
  - List of restaurants/vendors
  - Each card shows: image, name, rating, delivery time, delivery fee
  - Search & filter options (cuisine type, rating, delivery time)
- **Action:** Tap store → Menu Listing Page

**2.2.2 Menu Listing Page**
- **Header:** Store name, rating, delivery info
- **Content:**
  - Categories (tabs or dropdown): All, Snacks, Beverages, etc.
  - Food items in grid/list
  - Each item card: image, name, price, rating, add button
- **Floating Action:** Cart button (shows item count)
- **Actions:** Tap item → Product Detail Page

**2.2.3 Product Detail Page**
- **Content:**
  - Large product image (swipeable gallery)
  - Product name, price, rating, reviews count
  - Description
  - Quantity selector (-, count, +)
  - Customization options (if any)
  - Add-ons/extras (checkboxes)
- **Buttons:**
  - "Add to Cart" (primary)
  - "View Reviews" (secondary)

**2.2.4 Cart Page**
- **Content:**
  - List of items with quantity controls
  - Item subtotal for each
  - Promo code input
  - Subtotal, taxes, delivery fee, total
- **Actions:**
  - Edit quantities
  - Remove items
  - "Proceed to Checkout" (primary)

**2.2.5 Checkout Page**
- **Content:**
  - Delivery address (editable)
  - Delivery time estimate
  - Payment method selector (Card, UPI, Wallet)
  - Order summary
  - Special instructions (text input)
- **Buttons:**
  - "Place Order" (primary)
  - "Edit Cart" (secondary)

**2.2.6 Payment Success Page**
- **Content:**
  - Success checkmark animation
  - Order confirmation number
  - Estimated delivery time
  - Order details summary
- **Buttons:**
  - "Track Order"
  - "Continue Shopping"

#### 2.3 Catering Flow

**2.3.1 Catering Form Page**
- **Fields:**
  - Event date (date picker)
  - Event time (time picker)
  - Guest count (number input)
  - Event type (dropdown: Birthday, Wedding, Corporate, etc.)
  - Venue location (Google Maps)
- **Buttons:**
  - "Next" (primary)

**2.3.2 Menu Selection Page**
- **Content:**
  - Menu type selector: Veg, Non-Veg, Both, Alcohol option
  - Menu packages (budget, standard, premium)
  - Customization notes (text area)
- **Buttons:**
  - "Next" (primary)
  - "Back" (secondary)

**2.3.3 Review & Submit Page**
- **Content:**
  - Event summary
  - Menu selection summary
  - Estimated cost
  - Terms & conditions checkbox
- **Buttons:**
  - "Submit Request" (primary)
  - "Edit" (secondary)

**2.3.4 Request Submitted Page**
- **Content:**
  - Success message
  - Request ID
  - "Vendor will contact you soon" message
  - Estimated response time

#### 2.4 Tiffin Flow

**2.4.1 Vendor Selection Page**
- **Content:**
  - List of tiffin vendors
  - Each card: vendor name, rating, price per day, specialties
- **Action:** Select vendor → Subscription/Points Page

**2.4.2 Subscription/Points Page**
- **Content:**
  - Points balance display
  - Subscription plans (7-day, 30-day)
  - Price per meal
  - Recharge options
- **Buttons:**
  - "Select Plan" (primary)

**2.4.3 Calendar View Page**
- **Content:**
  - Calendar (min 2 days prior for editing)
  - Daily menu display
  - Status indicators (Pending, Delivered, Cancelled, Not Received)
  - Edit button for future dates
- **Actions:** Tap date → Menu Customization Page

**2.4.4 Menu Customization Page**
- **Content:**
  - Date display
  - Menu options (checkboxes for available items)
  - Special requests (text area)
- **Buttons:**
  - "Save" (primary)
  - "Cancel" (secondary)

#### 2.5 Reviews & Ratings
- **Review List Screen:**
  - List of past orders with review status
  - Star rating display
  - Review text
- **Add Review Screen:**
  - Star rating selector (1-5)
  - Review text area
  - Photo upload (optional)
  - Submit button

#### 2.6 Profile & Utilities

**2.6.1 Profile Page**
- **Content:**
  - User avatar, name, email, phone
  - Delivery address
  - Edit profile button
  - Logout button

**2.6.2 Order History**
- **Content:**
  - List of past orders
  - Each order: date, items, total, status
  - Tap to view details or reorder

**2.6.3 Order Tracking**
- **Content:**
  - Real-time order status (Confirmed → Cooking → Out for Delivery → Delivered)
  - Estimated time
  - Delivery agent location (map)
  - Contact delivery agent button

**2.6.4 Address Management**
- **Content:**
  - List of saved addresses
  - Add new address button
  - Edit/delete options

**2.6.5 Coupons & Referrals**
- **Content:**
  - Available coupons with discount info
  - Referral code display
  - Share referral button (WhatsApp, SMS, etc.)

---

### 3. Vendor Flow

#### 3.1 Vendor Dashboard
- **Header:** Vendor name, status (Online/Offline toggle)
- **Summary Cards:**
  - New Orders (count, badge)
  - Active Orders (count)
  - Earnings (today, total)
  - Rating (stars)
- **Quick Actions:** Orders, Tiffin Management, Analytics

#### 3.2 Orders Management

**3.2.1 Order List Screen**
- **Content:**
  - List of orders (sorted by time)
  - Each order card: order ID, customer name, items, total, status
  - Status badges (Pending, Cooking, Out for Delivery, Delivered)
- **Actions:** Tap order → Order Detail Screen

**3.2.2 Order Detail Screen**
- **Content:**
  - Order ID, customer name, phone
  - Items list with quantities
  - Delivery address
  - Special instructions
  - Order total
- **Status Update Buttons:**
  - "Confirm" (Pending → Cooking)
  - "Mark as Cooking" (Cooking)
  - "Out for Delivery" (Out for Delivery)
  - "Delivered" (Delivered)
  - "Cancel" (with reason)
- **Share Button:** WhatsApp, SMS, Email

#### 3.3 Tiffin Management

**3.3.1 Calendar Orders View**
- **Content:**
  - Calendar showing tiffin orders
  - Daily order count
  - Tap date → Daily Order List

**3.3.2 Daily Order List**
- **Content:**
  - List of tiffin orders for selected date
  - Customer name, address, menu items
  - Status for each order

**3.3.3 Status Update Screen**
- **Content:**
  - Order details
  - Status options: Cancelled, Delivered, Updated, Not Received, Pending
  - Notes field (optional)
- **Buttons:**
  - "Update Status" (primary)
  - "Cancel" (secondary)

#### 3.4 Share Screen
- **Content:**
  - Order details (read-only)
  - Share buttons: WhatsApp, SMS, Email, Copy Link
- **Share Message Template:** Order details, delivery address, contact info

---

### 4. Admin Flow

#### 4.1 Admin Dashboard
- **KPI Cards:**
  - Total Orders (today, this month)
  - Revenue (today, this month)
  - Active Customers
  - Active Vendors
  - Average Rating
- **Charts:** Orders trend, Revenue trend
- **Quick Actions:** Menu Management, Reviews, Export, Notifications

#### 4.2 Menu Management

**4.2.1 Menu List Screen**
- **Content:**
  - List of all menu items
  - Each item: image, name, vendor, price, status (active/inactive)
  - Search & filter options
- **Actions:** Tap item → Edit Menu Screen

**4.2.2 Add/Edit Menu Screen**
- **Fields:**
  - Item name
  - Vendor selector
  - Category (dropdown)
  - Price
  - Description
  - Image upload (camera/gallery)
  - Availability (toggle)
  - Dietary info (Veg/Non-Veg, Gluten-free, etc.)
- **Buttons:**
  - "Save" (primary)
  - "Delete" (secondary, red)
  - "Cancel" (tertiary)

#### 4.3 Reviews Management
- **Review List Screen:**
  - List of all customer reviews
  - Each review: customer name, rating, text, item, date
  - Filter by rating, vendor, date range
  - Delete/flag option

#### 4.4 Customer Data Export

**4.4.1 Export Page**
- **Content:**
  - Date range picker (from, to)
  - Export format selector (CSV, Excel)
  - Include fields checkboxes: Name, Email, Phone, Orders, Total Spent, Payment Method
- **Buttons:**
  - "Export" (primary)
  - "Cancel" (secondary)

#### 4.5 Notifications Page
- **Content:**
  - List of notifications
  - Filter tabs: All, Catering Orders, Tiffin Orders
  - Each notification: type, message, timestamp
- **Actions:**
  - Tap notification → Details
  - Share button (WhatsApp, Email, etc.)

#### 4.6 Reminder System
- **Past Orders List:**
  - List of orders from past 30 days
  - Customer name, order date, items
  - "Send Reminder" button
- **Follow-up Suggestions:**
  - Customers who haven't ordered in X days
  - Suggested message templates

#### 4.7 Catering Requests Management

**4.7.1 Request List Screen**
- **Content:**
  - List of catering requests
  - Each request: customer name, event date, guest count, status
  - Status badges: New, Confirmed, Cancelled, In Progress, Completed

**4.7.2 Request Detail Screen**
- **Content:**
  - Customer details (name, phone, email)
  - Event details (date, time, location, guest count)
  - Menu preferences
  - Special requests
  - Current status
- **Status Update Buttons:**
  - "Confirm" (New → Confirmed)
  - "In Progress" (Confirmed → In Progress)
  - "Completed" (In Progress → Completed)
  - "Cancel" (with reason)
- **Share Button:** Customer details, event info via WhatsApp/Email

---

## Global Components (Reusable)

| Component | Usage |
|-----------|-------|
| **App Bar** | Header with title, back button, action buttons |
| **Bottom Navigation** | Tab bar for main sections (Home, Orders, Favorites, Profile) |
| **Primary Button** | Main CTA (orange background, white text) |
| **Secondary Button** | Alternative action (outline style) |
| **Cards** | Content containers with shadow and border |
| **Status Chips** | Status badges (Pending, Delivered, Cancelled, etc.) |
| **Modals** | Dialogs for confirmations, alerts |
| **Toast/Snackbar** | Brief notifications (success, error, info) |
| **Loader/Skeleton** | Loading states |
| **Input Fields** | Text inputs with labels, error states |
| **Dropdown/Picker** | Selection components |

---

## Navigation Structure

```
Root
├── Auth Stack
│   ├── Splash
│   ├── Onboarding
│   ├── Login
│   └── Register
├── Customer Stack
│   ├── Home
│   ├── Chakna Store (nested)
│   │   ├── Store List
│   │   ├── Menu List
│   │   ├── Product Detail
│   │   ├── Cart
│   │   └── Checkout
│   ├── Catering (nested)
│   │   ├── Form
│   │   ├── Menu Selection
│   │   ├── Review
│   │   └── Submitted
│   ├── Tiffin (nested)
│   │   ├── Vendor Selection
│   │   ├── Subscription
│   │   ├── Calendar
│   │   └── Menu Customization
│   ├── Reviews
│   ├── Profile
│   ├── Order History
│   ├── Order Tracking
│   ├── Address Management
│   └── Coupons & Referrals
├── Vendor Stack
│   ├── Dashboard
│   ├── Orders (nested)
│   │   ├── Order List
│   │   └── Order Detail
│   ├── Tiffin Management (nested)
│   │   ├── Calendar View
│   │   ├── Daily Orders
│   │   └── Status Update
│   └── Share
└── Admin Stack
    ├── Dashboard
    ├── Menu Management (nested)
    │   ├── Menu List
    │   └── Add/Edit Menu
    ├── Reviews Management
    ├── Customer Data Export
    ├── Notifications
    ├── Reminder System
    └── Catering Requests (nested)
        ├── Request List
        └── Request Detail
```

---

## Key Features Summary

- **Authentication:** Email/password with role-based routing
- **Chakna Store:** Food delivery with cart, checkout, and payment
- **Catering:** Event-based requests with menu customization
- **Tiffin:** Subscription-based daily meal delivery with calendar
- **Reviews:** Customer ratings and feedback system
- **Payments:** Multiple payment methods (Card, UPI, Wallet)
- **Maps Integration:** Location picker, delivery tracking
- **Notifications:** Push notifications for orders, reminders
- **Admin Controls:** Menu management, data export, analytics
- **Vendor Tools:** Order management, status updates, earnings tracking
- **Social Sharing:** WhatsApp, SMS, Email integration
