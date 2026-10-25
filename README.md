# CleanRide Management System 🧼🚗

A modern, responsive web application designed for mobile upholstery and vehicle interior cleaning services, built in pure **HTML5, CSS3, and modern Vanilla JavaScript**.

Designed specifically in accordance with the **CleanRide Management System specification PDF** and the **JPEG operational architecture flowchart**.

---

## 🎨 Theme & Visual Design
- **Theme**: Soft Blue Modern Upholstery Cleaning (`#0ea5e9`, `#0284c7`, `#f0f9ff`, slate navy `#0f172a`).
- **Typography**: Google Font *Plus Jakarta Sans*.
- **Iconography**: FontAwesome 6 Pro-style icons.
- **Visuals**: Glassmorphism navigation bar, responsive pricing sidebar, interactive cards, status chips, and real-time toast alerts.

---

## 🗺️ Architectural Mapping to PDF & Diagram Flowchart

### 1. Dual-Role Authentication & Navigation
- **Quick-Role Switcher** on top bar: Instantly toggle between **Customer** (`Sarah Jenkins`) and **Owner / Manager** (`HQ Operations Manager`).

### 2. Customer Portal (`Customer Homepage`)
1. **Request Service (`Booking process`)**:
   - **Customer Information**: Full Name, Phone Number, Date, Location/Address (The owner records the customer's address and travels to their location).
   - **Service Types & Pricing Operations**:
     - 🚗 **Vehicle Interior Cleaning**: Priced per seat (Sedan 5-seater @ RM 125, SUV 7-seater @ RM 175, or Commercial Bus fleet with vehicle count and seat count).
     - 🛋️ **Sofa & Furniture**: Priced per furniture piece (Armchair, 2-seater, 3-seater L-shape sofa, dining set, mattress, curtains).
     - 🧼 **Carpet Cleaning**: Priced per area $m^2$ with material options (Low-pile, Shag, Wool).
     - 🧰 **Equipment Rental**: Priced per hour (Industrial Spray-Extraction Machine, Steam Cleaners, Wet & Dry Vacuums, Turbo Air Blowers).
   - **Dirtiness Severity Level (PDF Requirement)**:
     - *Light*: 1.00x multiplier
     - *Medium*: 1.25x multiplier
     - *Heavy*: 1.50x deep enzyme restoration
   - **Daily Capacity Check (PDF Step 2)**:
     - Automatically validates booked slots for the selected date against daily limit cap (max 4 jobs/day). Prompts user to pick another date if full.
   - **Deposit Payment Simulator (PDF Step 3)**:
     - Real-time 30% deposit calculation.
     - Checkout modal supporting Credit Card, FPX Online Banking, and Touch 'n Go / eWallet.
2. **Display Job List (`Display list job` & `Job details`)**:
   - Shows accepted or rejected status badge.
   - **Owner Number Phone**: Displayed on every job card (`+60 12-345 6789`) with one-click call link.
   - **Countdown Indicator**: Shows "days before the job" (e.g. *In 2 days*, *Tomorrow*, *Today*).
   - Displays payment status: *Deposit Paid*, *Installment Payment*, or *Payment Completed*.
3. **Complaint & Feedback Desk (`complaint form`)**:
   - Select related Job ID, category, subject, details, and optional evidence photo upload.
   - Real-time tracking of submitted reports with owner responses.

### 3. Owner / Manager Operations Command (`Owner Dashboard`)
1. **Request List (`can accept or reject`)**:
   - Review incoming requests, location route, dirtiness level, and deposit status.
   - One-click **Accept Job** (dispatches to schedule) or **Reject Job** (with reason note).
2. **Display Job List (`Display job list` -> `Job details`)**:
   - Dispatch table tracking customer, location, service type, and days countdown.
   - **Status Updater**: Update service status (*Accepted*, *In Progress*, *Completed*).
   - **Face-to-Face Payment Tracking (PDF Step 5)**: Update remaining payments (*Deposit Paid*, *Installment Payment*, *Payment Completed*).
3. **Rental List (`Rental details: price per hour, equipment borrowed`)**:
   - Dedicated tracking for borrowed tools, hourly fees, customer details, and return status.
4. **Complaint Desk (`Complaint list`)**:
   - Read customer grievance reports, draft official resolutions, and mark tickets resolved.
5. **Financial Report (`Financial report: monthly revenue, job's revenue`)**:
   - Total Gross Revenue, Deposits Collected Online, Face-to-Face Payments Completed, and Pending Balance.
   - Visual percentage bar breakdown by Service Category (Vehicle, Furniture, Carpet, Tool Rental).
   - Recent transaction audit stream with Print / PDF Export support.

---

## 🗄️ Relational Data Model (As specified in PDF)
- **Customer**: `customerId (PK)`, `fullName`, `phone`, `location`, `serviceDate`, `depositStatus`, `paymentStatus`, `jobId (FK)`, `vehiclePlate`
- **Job**: `jobId (PK)`, `customerId (FK)`, `serviceType`, `equipmentBorrowed`, `location`, `dirtinessLevel`, `totalPrice`, `depositAmount`, `remainingAmount`, `status`
- **Manager**: `manageId (PK)`, `monthlyRevenue`, `capacityCheck`, `complaintResolutions`
- **Vehicle**: `vehiclePlate (PK)`, `amountOfSeats`, `vehicleCount`

---

## 🚀 How to Run the Project
1. Navigate to:
   ```
   C:\Users\myams\.gemini\antigravity\scratch\cleanride-management-system
   ```
2. Double-click **`index.html`** or open it with any modern web browser (Google Chrome, Microsoft Edge, Firefox).
3. **No server, bundler, or build tool needed** — all logic runs natively with interactive LocalStorage persistence and sample seed data.
