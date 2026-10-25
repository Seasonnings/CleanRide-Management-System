/**
 * CleanRide Management System
 * Soft Blue Modern Upholstery & Cleaning Architecture
 * Implements full customer booking, daily capacity check, deposit payment,
 * job status countdowns, complaints desk, and owner financial analytics.
 */

// Storage Keys
const STORAGE_KEYS = {
  JOBS: 'cleanride_jobs_data',
  COMPLAINTS: 'cleanride_complaints_data',
  ACTIVE_USER: 'cleanride_active_user',
  APP_CONFIG: 'cleanride_config'
};

// Owner Contact Information (From JPEG: "owner number phone")
const OWNER_CONFIG = {
  name: 'CleanRide HQ Operations',
  phone: '+60 12-345 6789',
  email: 'operations@cleanride.com',
  dailyCapacityMax: 4
};

// Pricing Rates (From PDF Service Operations)
const PRICING_RATES = {
  vehicle: {
    sedan: { base: 125, seats: 5, label: 'Personal Sedan (5 Seats)' },
    suv: { base: 175, seats: 7, label: 'SUV / MPV (7 Seats)' },
    commercial: { pricePerSeat: 22, label: 'Commercial Bus / Fleet' }
  },
  furniture: {
    sofa_1: { price: 50, label: 'Single Recliner / Armchair' },
    sofa_2: { price: 90, label: '2-Seater Fabric Sofa' },
    sofa_3: { price: 140, label: '3-Seater L-Shape Sofa' },
    dining_chair: { price: 70, label: 'Dining Chair Set (4 Chairs)' },
    mattress_queen: { price: 110, label: 'Queen / King Mattress' },
    curtains: { price: 85, label: 'Full Set Window Curtains' }
  },
  carpet: {
    basePerArea: 8.0, // per m²
    materials: {
      standard: 0,
      shag: 20,
      wool: 35
    }
  },
  rental: {
    extractor: { rate: 25, label: 'Industrial Spray-Extraction Machine' },
    steam: { rate: 30, label: 'High-Temp Sanitizing Steam Cleaner' },
    vacuum: { rate: 20, label: 'Heavy-Duty Wet & Dry Extractor Vacuum' },
    blower: { rate: 15, label: 'Rapid Turbo Carpet Air Blower' },
    full_kit: { rate: 65, label: 'Complete Pro Detailing Kit' }
  },
  dirtinessMultipliers: {
    light: 1.0,
    medium: 1.25,
    heavy: 1.50
  },
  depositPercentage: 0.30 // 30% deposit upfront
};

// State Variables
let currentRole = 'customer'; // 'customer' or 'owner'
let currentUser = {
  id: 'CUST-8801',
  name: 'Sarah Jenkins',
  phone: '+60 12-889 4432',
  location: 'No 45, Jalan Harmoni 3, Bukit Indah'
};
let jobsData = [];
let complaintsData = [];
let pendingBookingPayload = null;

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initDefaultDate();
  renderRoleUI();
  calculateQuote();
  checkDailyCapacity();
});

/**
 * Initialize sample data if localStorage is empty
 */
function initStorage() {
  const storedJobs = localStorage.getItem(STORAGE_KEYS.JOBS);
  const storedComplaints = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);

  if (!storedJobs) {
    const today = new Date();
    const dateTomorrow = formatDate(addDays(today, 1));
    const dateIn3Days = formatDate(addDays(today, 3));
    const datePast = formatDate(addDays(today, -2));

    const sampleJobs = [
      {
        jobId: 'CR-JOB-101',
        customerId: 'CUST-8801',
        customerName: 'Sarah Jenkins',
        customerPhone: '+60 12-889 4432',
        location: 'No 45, Jalan Harmoni 3, Bukit Indah',
        serviceCategory: 'vehicle',
        serviceTitle: 'Vehicle Interior (Personal Sedan - 5 Seats)',
        serviceDate: dateTomorrow,
        dirtinessLevel: 'medium',
        dirtinessMultiplier: 1.25,
        details: { vehiclePlate: 'VDK 4921', vehicleType: 'sedan', vehicleSeats: 5 },
        totalPrice: 156.25,
        depositAmount: 46.88,
        remainingAmount: 109.37,
        status: 'Accepted', // Pending Approval, Accepted, In Progress, Completed, Rejected
        depositStatus: 'Deposit Paid',
        paymentStatus: 'Deposit Paid', // Deposit Paid, Installment Payment, Completed
        ownerPhone: OWNER_CONFIG.phone,
        notes: 'Child car seat installed in back; extra vacuum pass needed.',
        createdAt: new Date().toISOString()
      },
      {
        jobId: 'CR-JOB-102',
        customerId: 'CUST-8801',
        customerName: 'Sarah Jenkins',
        customerPhone: '+60 12-889 4432',
        location: 'No 45, Jalan Harmoni 3, Bukit Indah',
        serviceCategory: 'furniture',
        serviceTitle: 'Sofa Cleaning (3-Seater L-Shape Sofa)',
        serviceDate: dateIn3Days,
        dirtinessLevel: 'light',
        dirtinessMultiplier: 1.0,
        details: { furnitureType: 'sofa_3', quantity: 1 },
        totalPrice: 140.00,
        depositAmount: 42.00,
        remainingAmount: 98.00,
        status: 'Accepted',
        depositStatus: 'Deposit Paid',
        paymentStatus: 'Deposit Paid',
        ownerPhone: OWNER_CONFIG.phone,
        notes: 'Coffee stain on left armrest.',
        createdAt: new Date().toISOString()
      },
      {
        jobId: 'CR-JOB-103',
        customerId: 'CUST-5520',
        customerName: 'Ahmad Farhan',
        customerPhone: '+60 17-654 3210',
        location: 'Lot 12, Subang Hi-Tech Industrial Park',
        serviceCategory: 'rental',
        serviceTitle: 'Equipment Rental: Industrial Spray-Extraction Machine (8 hrs)',
        serviceDate: dateTomorrow,
        dirtinessLevel: 'light',
        dirtinessMultiplier: 1.0,
        details: { equipment: 'Industrial Spray-Extraction Machine', hours: 8, ratePerHour: 25 },
        totalPrice: 200.00,
        depositAmount: 60.00,
        remainingAmount: 140.00,
        status: 'In Progress',
        depositStatus: 'Deposit Paid',
        paymentStatus: 'Installment Payment',
        ownerPhone: OWNER_CONFIG.phone,
        notes: 'Self-pickup arranged at workshop.',
        createdAt: new Date().toISOString()
      },
      {
        jobId: 'CR-JOB-104',
        customerId: 'CUST-8801',
        customerName: 'Sarah Jenkins',
        customerPhone: '+60 12-889 4432',
        location: 'No 45, Jalan Harmoni 3, Bukit Indah',
        serviceCategory: 'carpet',
        serviceTitle: 'Carpet Deep Extraction (20 m² area)',
        serviceDate: datePast,
        dirtinessLevel: 'heavy',
        dirtinessMultiplier: 1.5,
        details: { area: 20, material: 'Shag / High-Pile Luxury Rug' },
        totalPrice: 270.00,
        depositAmount: 81.00,
        remainingAmount: 0.00,
        status: 'Completed',
        depositStatus: 'Deposit Paid',
        paymentStatus: 'Completed',
        ownerPhone: OWNER_CONFIG.phone,
        notes: 'Deep pet urine enzyme extraction completed successfully.',
        createdAt: new Date().toISOString()
      }
    ];

    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(sampleJobs));
    jobsData = sampleJobs;
  } else {
    jobsData = JSON.parse(storedJobs);
  }

  if (!storedComplaints) {
    const sampleComplaints = [
      {
        complaintId: 'CR-CMP-201',
        jobId: 'CR-JOB-104',
        customerName: 'Sarah Jenkins',
        category: 'Service Quality',
        subject: 'Faint damp scent remained after 24 hrs',
        details: 'The living room rug felt damp longer than anticipated. Required fan drying.',
        status: 'Resolved',
        ownerReply: 'We provided 2 extra turbo air blowers at zero cost to speed dry. Thank you for your feedback!',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(sampleComplaints));
    complaintsData = sampleComplaints;
  } else {
    complaintsData = JSON.parse(storedComplaints);
  }
}

function saveJobsToStorage() {
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobsData));
}

function saveComplaintsToStorage() {
  localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaintsData));
}

// Helpers for dates
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function initDefaultDate() {
  const dateInput = document.getElementById('custDate');
  if (dateInput) {
    const tomorrow = addDays(new Date(), 1);
    dateInput.value = formatDate(tomorrow);
    dateInput.min = formatDate(new Date());
  }
}

/**
 * Switch role between Customer & Owner
 */
function switchRole(role) {
  currentRole = role;

  const pillCust = document.getElementById('pillCustomer');
  const pillOwner = document.getElementById('pillOwner');
  const custPortal = document.getElementById('customerPortal');
  const ownerPortal = document.getElementById('ownerPortal');

  const navAvatar = document.getElementById('navAvatar');
  const navUserName = document.getElementById('navUserName');
  const navUserRole = document.getElementById('navUserRole');

  if (role === 'customer') {
    pillCust.classList.add('active');
    pillOwner.classList.remove('active');
    custPortal.classList.add('active');
    ownerPortal.classList.remove('active');

    navAvatar.textContent = 'SJ';
    navUserName.textContent = currentUser.name;
    navUserRole.textContent = 'Customer';

    renderCustomerJobs();
    renderCustomerComplaints();
    populateComplaintJobDropdown();
  } else {
    pillOwner.classList.add('active');
    pillCust.classList.remove('active');
    ownerPortal.classList.add('active');
    custPortal.classList.remove('active');

    navAvatar.textContent = 'MG';
    navUserName.textContent = 'HQ Operations Manager';
    navUserRole.textContent = 'Owner / Manager';

    renderOwnerDashboard();
  }

  showToast(`Switched view to ${role === 'customer' ? 'Customer Portal' : 'Owner / Manager Dashboard'}`);
}

function renderRoleUI() {
  if (currentRole === 'customer') {
    renderCustomerJobs();
    renderCustomerComplaints();
    populateComplaintJobDropdown();
  } else {
    renderOwnerDashboard();
  }
}

function handleLogout() {
  showToast('Logged out of CleanRide session.');
  setTimeout(() => {
    switchRole('customer');
  }, 300);
}

/**
 * Customer Tab Navigation
 */
function switchCustomerTab(tabName) {
  document.querySelectorAll('[data-cust-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cust-tab') === tabName);
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  const targetContent = document.getElementById(`custTab-${tabName}`);
  if (targetContent) targetContent.classList.add('active');

  if (tabName === 'my-jobs') {
    renderCustomerJobs();
  } else if (tabName === 'lodge-complaint') {
    populateComplaintJobDropdown();
    renderCustomerComplaints();
  }
}

function navigateToCustomerTab(tabName) {
  switchCustomerTab(tabName);
  window.scrollTo({ top: 380, behavior: 'smooth' });
}

/**
 * Service Category Toggle in Booking Form
 */
function toggleServiceFields() {
  const selectedCategory = document.querySelector('input[name="serviceCategory"]:checked').value;
  const categories = ['vehicle', 'furniture', 'carpet', 'rental'];

  categories.forEach(cat => {
    const el = document.getElementById(`serviceFields-${cat}`);
    if (el) {
      el.style.display = (cat === selectedCategory) ? 'block' : 'none';
    }
  });

  const vehicleTypeSelect = document.getElementById('vehicleTypeSelect');
  const busFleetRow = document.getElementById('busFleetRow');
  if (busFleetRow && vehicleTypeSelect) {
    busFleetRow.style.display = (vehicleTypeSelect.value === 'commercial' && selectedCategory === 'vehicle') ? 'flex' : 'none';
  }

  calculateQuote();
}

document.getElementById('vehicleTypeSelect')?.addEventListener('change', (e) => {
  const busFleetRow = document.getElementById('busFleetRow');
  if (busFleetRow) {
    busFleetRow.style.display = (e.target.value === 'commercial') ? 'flex' : 'none';
  }
  calculateQuote();
});

/**
 * Dynamic Quote Calculator (PDF Pricing Logic)
 */
function calculateQuote() {
  const category = document.querySelector('input[name="serviceCategory"]:checked')?.value || 'vehicle';
  const dirtiness = document.querySelector('input[name="dirtinessLevel"]:checked')?.value || 'light';
  const dirtMultiplier = PRICING_RATES.dirtinessMultipliers[dirtiness] || 1.0;

  let basePrice = 0;
  let serviceTitle = '';

  if (category === 'vehicle') {
    const vType = document.getElementById('vehicleTypeSelect')?.value || 'sedan';
    if (vType === 'sedan') {
      basePrice = PRICING_RATES.vehicle.sedan.base;
      serviceTitle = 'Vehicle Interior (Personal Sedan - 5 Seats)';
    } else if (vType === 'suv') {
      basePrice = PRICING_RATES.vehicle.suv.base;
      serviceTitle = 'Vehicle Interior (SUV / MPV - 7 Seats)';
    } else if (vType === 'commercial') {
      const vCount = Math.max(1, parseInt(document.getElementById('vehicleCount')?.value || 1));
      const vSeats = Math.max(1, parseInt(document.getElementById('vehicleSeats')?.value || 30));
      basePrice = vCount * (vSeats * PRICING_RATES.vehicle.commercial.pricePerSeat);
      serviceTitle = `Commercial Fleet Cleaning (${vCount} Vehicle(s) × ${vSeats} Seats)`;
    }
  } else if (category === 'furniture') {
    const fType = document.getElementById('furnitureType')?.value || 'sofa_1';
    const fQty = Math.max(1, parseInt(document.getElementById('furnitureQuantity')?.value || 1));
    const itemData = PRICING_RATES.furniture[fType];
    basePrice = itemData.price * fQty;
    serviceTitle = `${itemData.label} (Qty: ${fQty})`;
  } else if (category === 'carpet') {
    const area = Math.max(1, parseFloat(document.getElementById('carpetArea')?.value || 1));
    const material = document.getElementById('carpetType')?.value || 'standard';
    const extraMat = PRICING_RATES.carpet.materials[material] || 0;
    basePrice = (area * PRICING_RATES.carpet.basePerArea) + extraMat;
    serviceTitle = `Carpet Deep Extraction (${area} m² area)`;
  } else if (category === 'rental') {
    const toolKey = document.getElementById('rentalEquipment')?.value || 'extractor';
    const hours = Math.max(1, parseInt(document.getElementById('rentalHours')?.value || 1));
    const toolData = PRICING_RATES.rental[toolKey];
    basePrice = toolData.rate * hours;
    serviceTitle = `Equipment Rental: ${toolData.label} (${hours} hrs)`;
  }

  // Multiply by dirtiness (except tool rental which is clean gear)
  let effectiveMultiplier = (category === 'rental') ? 1.0 : dirtMultiplier;
  let totalPrice = basePrice * effectiveMultiplier;
  let depositAmount = totalPrice * PRICING_RATES.depositPercentage;
  let remainingAmount = totalPrice - depositAmount;

  // Update Summary UI
  const titleEl = document.getElementById('summaryServiceTitle');
  const baseEl = document.getElementById('summaryBasePrice');
  const dirtLabelEl = document.getElementById('summaryDirtLabel');
  const dirtMultEl = document.getElementById('summaryDirtMultiplier');
  const totalEl = document.getElementById('summaryTotalPrice');
  const depEl = document.getElementById('summaryDepositAmount');
  const remEl = document.getElementById('summaryRemainingAmount');

  if (titleEl) titleEl.textContent = serviceTitle;
  if (baseEl) baseEl.textContent = `RM ${basePrice.toFixed(2)}`;
  if (dirtLabelEl) dirtLabelEl.textContent = dirtiness.charAt(0).toUpperCase() + dirtiness.slice(1);
  if (dirtMultEl) dirtMultEl.textContent = `${effectiveMultiplier.toFixed(2)}x`;
  if (totalEl) totalEl.textContent = `RM ${totalPrice.toFixed(2)}`;
  if (depEl) depEl.textContent = `RM ${depositAmount.toFixed(2)}`;
  if (remEl) remEl.textContent = `RM ${remainingAmount.toFixed(2)}`;

  return {
    category,
    serviceTitle,
    basePrice,
    effectiveMultiplier,
    dirtiness,
    totalPrice,
    depositAmount,
    remainingAmount
  };
}

/**
 * Check Daily Booking Capacity (PDF Step 2)
 */
function checkDailyCapacity() {
  const dateInput = document.getElementById('custDate');
  const feedback = document.getElementById('capacityFeedback');
  const submitBtn = document.getElementById('btnSubmitBooking');
  if (!dateInput || !feedback) return;

  const selectedDate = dateInput.value;
  if (!selectedDate) return;

  const countForDate = jobsData.filter(job => job.serviceDate === selectedDate && job.status !== 'Rejected').length;
  const maxCap = OWNER_CONFIG.dailyCapacityMax;

  if (countForDate >= maxCap) {
    feedback.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Daily limit reached (${countForDate}/${maxCap} bookings). CleanRide daily capacity is full. Please choose another date.</span>`;
    if (submitBtn) submitBtn.disabled = true;
    return false;
  } else {
    feedback.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check"></i> ${countForDate} / ${maxCap} slots booked on this day. Capacity available!</span>`;
    if (submitBtn) submitBtn.disabled = false;
    return true;
  }
}

/**
 * Handle Booking Submission -> Launch Deposit Payment Modal
 */
function handleBookingSubmit(event) {
  event.preventDefault();

  if (!checkDailyCapacity()) {
    showToast('CleanRide daily capacity is reached for this date. Please pick another date.', 'danger');
    return;
  }

  const fullName = document.getElementById('custFullName').value.trim() || currentUser.name;
  const phone = document.getElementById('custPhone').value.trim() || currentUser.phone;
  const location = document.getElementById('custLocation').value.trim() || currentUser.location;
  const serviceDate = document.getElementById('custDate').value;
  const notes = document.getElementById('bookingNotes').value.trim();

  const quote = calculateQuote();

  // Additional details extraction
  let details = {};
  if (quote.category === 'vehicle') {
    const plate = document.getElementById('vehiclePlate').value.trim() || 'WXX 1234';
    const vType = document.getElementById('vehicleTypeSelect').value;
    details = { vehiclePlate: plate, vehicleType: vType };
  } else if (quote.category === 'furniture') {
    const fType = document.getElementById('furnitureType').value;
    const fQty = parseInt(document.getElementById('furnitureQuantity').value || 1);
    details = { furnitureType: fType, quantity: fQty };
  } else if (quote.category === 'carpet') {
    const area = parseFloat(document.getElementById('carpetArea').value || 10);
    const mat = document.getElementById('carpetType').value;
    details = { area, material: mat };
  } else if (quote.category === 'rental') {
    const tool = document.getElementById('rentalEquipment').value;
    const hrs = parseInt(document.getElementById('rentalHours').value || 3);
    details = { equipment: tool, hours: hrs };
  }

  const generatedJobId = `CR-JOB-${Math.floor(100 + Math.random() * 900)}`;

  pendingBookingPayload = {
    jobId: generatedJobId,
    customerId: currentUser.id,
    customerName: fullName,
    customerPhone: phone,
    location,
    serviceDate,
    serviceCategory: quote.category,
    serviceTitle: quote.serviceTitle,
    dirtinessLevel: quote.dirtiness,
    dirtinessMultiplier: quote.effectiveMultiplier,
    details,
    totalPrice: quote.totalPrice,
    depositAmount: quote.depositAmount,
    remainingAmount: quote.remainingAmount,
    status: 'Pending Approval', // Awaiting Owner Review (From Diagram)
    depositStatus: 'Deposit Paid',
    paymentStatus: 'Deposit Paid',
    ownerPhone: OWNER_CONFIG.phone,
    notes,
    createdAt: new Date().toISOString()
  };

  // Open Deposit Payment Simulator Modal
  document.getElementById('modalJobRef').textContent = generatedJobId;
  document.getElementById('modalDepositAmount').textContent = `RM ${quote.depositAmount.toFixed(2)}`;
  document.getElementById('payCardName').value = fullName;

  openModal('depositPaymentModal');
}

/**
 * Confirm Deposit Payment (PDF Step 3)
 */
function confirmDepositPayment() {
  if (!pendingBookingPayload) return;

  const btn = document.getElementById('btnConfirmPayDeposit');
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Payment...`;
  btn.disabled = true;

  setTimeout(() => {
    // Add job to list
    jobsData.unshift(pendingBookingPayload);
    saveJobsToStorage();

    closeModal('depositPaymentModal');
    btn.innerHTML = `<i class="fa-solid fa-lock"></i> Authorize & Pay Deposit`;
    btn.disabled = false;

    showToast(`Deposit paid! Booking ${pendingBookingPayload.jobId} submitted to owner.`, 'success');

    // Reset Form
    document.getElementById('bookingForm').reset();
    initDefaultDate();
    calculateQuote();
    checkDailyCapacity();

    // Switch to Customer My Jobs Tab
    switchCustomerTab('my-jobs');
    pendingBookingPayload = null;
  }, 1000);
}

/**
 * Compute days before the job (JPEG Requirement: "days before the job... idk")
 */
function getDaysBeforeJobLabel(serviceDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jobDate = new Date(serviceDateStr);
  jobDate.setHours(0, 0, 0, 0);

  const diffTime = jobDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: 'Today', class: 'tag-red', days: 0 };
  } else if (diffDays === 1) {
    return { text: 'Tomorrow (1 day)', class: 'tag-yellow', days: 1 };
  } else if (diffDays > 1) {
    return { text: `In ${diffDays} days`, class: 'tag-green', days: diffDays };
  } else {
    return { text: `${Math.abs(diffDays)} days ago`, class: 'tag-green', days: diffDays };
  }
}

/**
 * Render Customer's Display Job List (JPEG: Display list job -> Job details)
 */
function renderCustomerJobs() {
  const container = document.getElementById('customerJobsList');
  const badge = document.getElementById('customerJobBadge');
  if (!container) return;

  const myJobs = jobsData.filter(j => j.customerId === currentUser.id);
  if (badge) badge.textContent = myJobs.length;

  if (myJobs.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem;">
        <i class="fa-solid fa-box-open" style="font-size: 2.5rem; color: var(--slate-300); margin-bottom: 1rem;"></i>
        <h3>No Bookings Yet</h3>
        <p>You haven't requested any upholstery or cleaning jobs. Click below to start!</p>
        <button class="btn btn-primary" style="margin-top: 1rem;" onclick="switchCustomerTab('request-service')">
          <i class="fa-solid fa-calendar-plus"></i> Request CleanRide Service
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = myJobs.map(job => {
    const daysInfo = getDaysBeforeJobLabel(job.serviceDate);

    // Status styling
    let statusBadge = '<span class="badge badge-warning">Pending Approval</span>';
    if (job.status === 'Accepted') statusBadge = '<span class="badge badge-info"><i class="fa-solid fa-circle-check"></i> Accepted</span>';
    if (job.status === 'In Progress') statusBadge = '<span class="badge badge-warning"><i class="fa-solid fa-spinner fa-spin"></i> In Progress</span>';
    if (job.status === 'Completed') statusBadge = '<span class="badge badge-success"><i class="fa-solid fa-check-double"></i> Completed</span>';
    if (job.status === 'Rejected') statusBadge = '<span class="badge badge-danger"><i class="fa-solid fa-ban"></i> Rejected</span>';

    return `
      <div class="job-card">
        <div>
          <div class="job-card-header">
            <span class="job-id-tag">${job.jobId}</span>
            <span class="countdown-pill"><i class="fa-regular fa-clock"></i> ${daysInfo.text}</span>
          </div>

          <div class="job-card-body">
            <h4 class="job-service-name">${job.serviceTitle}</h4>
            
            <div class="job-details-meta">
              <div><i class="fa-solid fa-calendar text-primary"></i> <span>Service Date: <strong>${job.serviceDate}</strong></span></div>
              <div><i class="fa-solid fa-location-dot text-primary"></i> <span title="${job.location}">${truncate(job.location, 38)}</span></div>
              <div><i class="fa-solid fa-droplet text-primary"></i> <span>Dirtiness: <strong>${capitalize(job.dirtinessLevel)} (${job.dirtinessMultiplier}x)</strong></span></div>
              ${job.details?.vehiclePlate ? `<div><i class="fa-solid fa-car text-primary"></i> <span>Plate: <strong>${job.details.vehiclePlate}</strong></span></div>` : ''}
            </div>

            <!-- Owner Contact Phone (From JPEG requirement) -->
            <div class="job-contact-bar">
              <span><i class="fa-solid fa-phone text-primary"></i> Owner Phone: <strong>${job.ownerPhone}</strong></span>
              <a href="tel:${job.ownerPhone}" class="btn btn-sm btn-secondary" title="Call Owner"><i class="fa-solid fa-phone"></i> Call</a>
            </div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <span>Job Status:</span>
            ${statusBadge}
          </div>

          <div class="job-card-footer">
            <div class="job-card-price">
              <span class="job-price-val">RM ${job.totalPrice.toFixed(2)}</span>
              <span class="job-pay-status"><i class="fa-solid fa-shield-check"></i> ${job.paymentStatus}</span>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="viewJobDetails('${job.jobId}')">
              <i class="fa-solid fa-eye"></i> Details
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Display Job Details Modal (PDF & JPEG Details)
 */
function viewJobDetails(jobId) {
  const job = jobsData.find(j => j.jobId === jobId);
  if (!job) return;

  const daysInfo = getDaysBeforeJobLabel(job.serviceDate);

  document.getElementById('modalJobTitle').textContent = `Job Details: ${job.jobId}`;
  const body = document.getElementById('modalJobDetailsBody');

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
      <div class="card" style="padding: 1rem;">
        <span class="pay-label">Customer Information</span>
        <strong style="display:block; margin: 4px 0 2px;">${job.customerName}</strong>
        <p style="font-size: 0.85rem; margin: 0;"><i class="fa-solid fa-phone"></i> ${job.customerPhone}</p>
        <p style="font-size: 0.85rem; margin-top: 4px;"><i class="fa-solid fa-location-dot"></i> ${job.location}</p>
      </div>

      <div class="card" style="padding: 1rem;">
        <span class="pay-label">Owner Dispatch Details</span>
        <strong style="display:block; margin: 4px 0 2px;">CleanRide Mobile Team</strong>
        <p style="font-size: 0.85rem; margin: 0;"><i class="fa-solid fa-phone"></i> Owner Hotline: <strong>${job.ownerPhone}</strong></p>
        <p style="font-size: 0.85rem; margin-top: 4px;"><i class="fa-regular fa-clock"></i> Countdown: <strong>${daysInfo.text} (${job.serviceDate})</strong></p>
      </div>
    </div>

    <div class="card" style="padding: 1rem; margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h4 style="margin: 0;"><i class="fa-solid fa-soap text-primary"></i> ${job.serviceTitle}</h4>
        <span class="badge badge-info">${job.serviceCategory.toUpperCase()}</span>
      </div>
      <div style="font-size: 0.88rem; color: var(--slate-700); line-height: 1.6;">
        <div>&bull; Dirtiness Severity: <strong>${capitalize(job.dirtinessLevel)} (${job.dirtinessMultiplier}x rate)</strong></div>
        ${job.details?.vehiclePlate ? `<div>&bull; Vehicle Plate No: <strong>${job.details.vehiclePlate}</strong></div>` : ''}
        ${job.details?.hours ? `<div>&bull; Rental Equipment Duration: <strong>${job.details.hours} Hours</strong></div>` : ''}
        ${job.details?.area ? `<div>&bull; Area Cleaned: <strong>${job.details.area} m²</strong></div>` : ''}
        ${job.notes ? `<div style="margin-top: 6px;">&bull; Customer Instructions: <em>"${job.notes}"</em></div>` : ''}
      </div>
    </div>

    <div class="deposit-highlight-box">
      <div class="dep-row">
        <span>Total Service Quote:</span>
        <strong style="font-size: 1.25rem;">RM ${job.totalPrice.toFixed(2)}</strong>
      </div>
      <div class="dep-row">
        <span>Deposit Paid Online:</span>
        <span class="text-success" style="font-weight: 700;">RM ${job.depositAmount.toFixed(2)}</span>
      </div>
      <div class="dep-row">
        <span>Remaining Balance (Face-to-Face):</span>
        <strong class="text-primary">RM ${job.remainingAmount.toFixed(2)}</strong>
      </div>
      <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--primary-200); display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span>Service Status: <strong>${job.status}</strong></span>
        <span>Payment Settlement: <strong>${job.paymentStatus}</strong></span>
      </div>
    </div>
  `;

  openModal('jobDetailsModal');
}

/**
 * Customer Complaints (JPEG requirement: "complaint form")
 */
function populateComplaintJobDropdown() {
  const select = document.getElementById('complaintJobSelect');
  if (!select) return;

  const myJobs = jobsData.filter(j => j.customerId === currentUser.id);
  if (myJobs.length === 0) {
    select.innerHTML = '<option value="">No bookings available</option>';
    return;
  }

  select.innerHTML = myJobs.map(j => `
    <option value="${j.jobId}">${j.jobId} - ${j.serviceTitle} (${j.serviceDate})</option>
  `).join('');
}

function handleComplaintSubmit(event) {
  event.preventDefault();

  const jobId = document.getElementById('complaintJobSelect').value;
  const category = document.getElementById('complaintCategory').value;
  const subject = document.getElementById('complaintSubject').value.trim();
  const details = document.getElementById('complaintDetails').value.trim();

  if (!jobId) {
    showToast('Please select a valid Job ID.', 'warning');
    return;
  }

  const newComplaint = {
    complaintId: `CR-CMP-${Math.floor(200 + Math.random() * 800)}`,
    jobId,
    customerName: currentUser.name,
    category,
    subject,
    details,
    status: 'Pending Review',
    ownerReply: null,
    createdAt: new Date().toISOString()
  };

  complaintsData.unshift(newComplaint);
  saveComplaintsToStorage();

  showToast(`Complaint submitted (${newComplaint.complaintId}). Our manager will follow up!`, 'success');
  document.getElementById('complaintForm').reset();
  renderCustomerComplaints();
}

function renderCustomerComplaints() {
  const container = document.getElementById('custComplaintsList');
  const countBadge = document.getElementById('custComplaintCountBadge');
  if (!container) return;

  const myComplaints = complaintsData.filter(c => c.customerName === currentUser.name);
  if (countBadge) countBadge.textContent = `${myComplaints.length} Reports`;

  if (myComplaints.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--slate-400);">
        <i class="fa-solid fa-face-smile" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
        <span>No complaints lodged. Everything running smoothly!</span>
      </div>
    `;
    return;
  }

  container.innerHTML = myComplaints.map(c => `
    <div class="complaint-item">
      <div class="complaint-header-row">
        <div>
          <strong style="font-size: 0.88rem; color: var(--slate-900);">${c.subject}</strong>
          <span style="display:block; font-size: 0.75rem; color: var(--slate-500); font-family: monospace;">Ref: ${c.complaintId} | Job: ${c.jobId}</span>
        </div>
        <span class="badge ${c.status === 'Resolved' ? 'badge-success' : 'badge-warning'}">${c.status}</span>
      </div>

      <p style="font-size: 0.82rem; color: var(--slate-600); margin: 0.35rem 0;">${c.details}</p>

      ${c.ownerReply ? `
        <div class="complaint-reply-box">
          <strong style="color: var(--primary-800);"><i class="fa-solid fa-reply"></i> Manager Response:</strong>
          <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--slate-700);">${c.ownerReply}</p>
        </div>
      ` : `
        <div style="font-size: 0.75rem; color: var(--amber-600); margin-top: 0.4rem;">
          <i class="fa-solid fa-clock"></i> Waiting for manager review...
        </div>
      `}
    </div>
  `).join('');
}

/**
 * ========================================================
 * OWNER / MANAGER DASHBOARD LOGIC (From Diagram & PDF)
 * ========================================================
 */
function switchOwnerTab(tabName) {
  document.querySelectorAll('[data-owner-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-owner-tab') === tabName);
  });

  document.querySelectorAll('.owner-tab-content').forEach(content => {
    content.classList.remove('active');
  });

  const targetContent = document.getElementById(`ownerTab-${tabName}`);
  if (targetContent) targetContent.classList.add('active');

  if (tabName === 'requests') renderOwnerRequests();
  if (tabName === 'jobs') renderOwnerJobs();
  if (tabName === 'rentals') renderOwnerRentals();
  if (tabName === 'complaints') renderOwnerComplaints();
  if (tabName === 'financials') renderFinancialReport();
}

function renderOwnerDashboard() {
  updateOwnerKPIs();
  renderOwnerRequests();
  renderOwnerJobs();
  renderOwnerRentals();
  renderOwnerComplaints();
  renderFinancialReport();
}

function updateOwnerKPIs() {
  const pendingRequests = jobsData.filter(j => j.status === 'Pending Approval').length;
  const activeJobs = jobsData.filter(j => j.status === 'Accepted' || j.status === 'In Progress').length;
  const rentals = jobsData.filter(j => j.serviceCategory === 'rental' && j.status !== 'Rejected').length;
  const totalRevenue = jobsData
    .filter(j => j.status !== 'Rejected')
    .reduce((acc, j) => acc + (j.paymentStatus === 'Completed' ? j.totalPrice : j.depositAmount), 0);

  document.getElementById('kpiPendingRequests').textContent = pendingRequests;
  document.getElementById('kpiActiveJobs').textContent = activeJobs;
  document.getElementById('kpiRentals').textContent = rentals;
  document.getElementById('kpiMonthlyRevenue').textContent = `RM ${totalRevenue.toFixed(2)}`;

  document.getElementById('ownerRequestBadge').textContent = pendingRequests;
  document.getElementById('ownerComplaintBadge').textContent = complaintsData.filter(c => c.status !== 'Resolved').length;

  const todayStr = formatDate(new Date());
  const todayJobsCount = jobsData.filter(j => j.serviceDate === todayStr && j.status !== 'Rejected').length;
  document.getElementById('ownerCapacityDisplay').textContent = `${todayJobsCount} / ${OWNER_CONFIG.dailyCapacityMax} Jobs Today`;
}

/**
 * 1. Owner Request List (JPEG: "can accept or reject")
 */
function renderOwnerRequests() {
  const container = document.getElementById('ownerRequestList');
  if (!container) return;

  const pendingList = jobsData.filter(j => j.status === 'Pending Approval');

  if (pendingList.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem;">
        <i class="fa-solid fa-inbox" style="font-size: 2.5rem; color: var(--slate-300); margin-bottom: 0.75rem;"></i>
        <h4>No Pending Requests</h4>
        <p>All customer service requests have been processed.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = pendingList.map(req => {
    const daysInfo = getDaysBeforeJobLabel(req.serviceDate);

    return `
      <div class="request-card">
        <div class="req-header">
          <span class="job-id-tag">${req.jobId}</span>
          <span class="countdown-pill"><i class="fa-regular fa-clock"></i> ${daysInfo.text}</span>
        </div>

        <div class="req-body">
          <h4 class="req-customer">${req.customerName}</h4>
          <span class="badge badge-info" style="margin-top: 4px;">${req.serviceTitle}</span>

          <div class="req-meta-list">
            <div><i class="fa-solid fa-phone text-primary"></i> <span>${req.customerPhone}</span></div>
            <div><i class="fa-solid fa-location-dot text-primary"></i> <span>${req.location}</span></div>
            <div><i class="fa-solid fa-calendar text-primary"></i> <span>Service Date: <strong>${req.serviceDate}</strong></span></div>
            <div><i class="fa-solid fa-droplet text-primary"></i> <span>Dirtiness: <strong>${capitalize(req.dirtinessLevel)} (${req.dirtinessMultiplier}x)</strong></span></div>
            ${req.details?.vehiclePlate ? `<div><i class="fa-solid fa-car text-primary"></i> <span>Plate: <strong>${req.details.vehiclePlate}</strong></span></div>` : ''}
            <div><i class="fa-solid fa-money-bill-wave text-success"></i> <span>Deposit Received: <strong>RM ${req.depositAmount.toFixed(2)}</strong> (Total: RM ${req.totalPrice.toFixed(2)})</span></div>
          </div>
        </div>

        <div class="req-actions">
          <button class="btn btn-success flex-1" onclick="ownerAcceptRequest('${req.jobId}')">
            <i class="fa-solid fa-check"></i> Accept Job
          </button>
          <button class="btn btn-danger flex-1" onclick="ownerRejectRequest('${req.jobId}')">
            <i class="fa-solid fa-xmark"></i> Reject Job
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function ownerAcceptRequest(jobId) {
  const job = jobsData.find(j => j.jobId === jobId);
  if (!job) return;

  job.status = 'Accepted';
  saveJobsToStorage();
  updateOwnerKPIs();
  renderOwnerRequests();
  renderOwnerJobs();
  showToast(`Booking ${jobId} accepted into dispatch pipeline!`, 'success');
}

function ownerRejectRequest(jobId) {
  const reason = prompt('Optional rejection note (e.g. Area out of mobile service coverage):', 'Route fully booked for this day');
  const job = jobsData.find(j => j.jobId === jobId);
  if (!job) return;

  job.status = 'Rejected';
  job.notes = reason ? `Rejected: ${reason}` : 'Rejected by manager';
  saveJobsToStorage();
  updateOwnerKPIs();
  renderOwnerRequests();
  showToast(`Booking ${jobId} has been rejected.`, 'warning');
}

/**
 * 2. Owner Display Job List (JPEG: "location, service type, day before the job, can change status, complete or not, amount paid")
 */
function renderOwnerJobs() {
  const tableBody = document.getElementById('ownerJobsTableBody');
  const filter = document.getElementById('jobStatusFilter')?.value || 'all';
  if (!tableBody) return;

  let list = jobsData.filter(j => j.status !== 'Pending Approval' && j.status !== 'Rejected');
  if (filter !== 'all') {
    list = list.filter(j => j.status === filter);
  }

  if (list.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--slate-400);">
          No scheduled jobs matching the filter.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = list.map(job => {
    const daysInfo = getDaysBeforeJobLabel(job.serviceDate);

    // Badges
    let sBadge = '<span class="badge badge-info">Accepted</span>';
    if (job.status === 'In Progress') sBadge = '<span class="badge badge-warning"><i class="fa-solid fa-spinner fa-spin"></i> In Progress</span>';
    if (job.status === 'Completed') sBadge = '<span class="badge badge-success"><i class="fa-solid fa-check-double"></i> Completed</span>';

    let pBadge = `<span class="badge badge-warning">${job.paymentStatus}</span>`;
    if (job.paymentStatus === 'Completed') pBadge = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Fully Paid</span>`;
    if (job.paymentStatus === 'Installment Payment') pBadge = `<span class="badge badge-info"><i class="fa-solid fa-clock-rotate-left"></i> Installment</span>`;

    return `
      <tr>
        <td><span class="job-id-tag">${job.jobId}</span></td>
        <td>
          <strong>${job.customerName}</strong>
          <div style="font-size: 0.78rem; color: var(--slate-500);"><i class="fa-solid fa-phone"></i> ${job.customerPhone}</div>
        </td>
        <td>
          <div><strong>${job.serviceTitle}</strong></div>
          <div style="font-size: 0.78rem; color: var(--slate-500);" title="${job.location}">
            <i class="fa-solid fa-location-dot"></i> ${truncate(job.location, 30)}
          </div>
        </td>
        <td>
          <span class="countdown-pill">${daysInfo.text}</span>
          <div style="font-size: 0.75rem; color: var(--slate-500); margin-top: 2px;">${job.serviceDate}</div>
        </td>
        <td>${sBadge}</td>
        <td>
          ${pBadge}
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--slate-800); margin-top: 2px;">
            Total: RM ${job.totalPrice.toFixed(2)}
          </div>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="openOwnerStatusModal('${job.jobId}')">
            <i class="fa-solid fa-pen-to-square"></i> Update
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openOwnerStatusModal(jobId) {
  const job = jobsData.find(j => j.jobId === jobId);
  if (!job) return;

  document.getElementById('editJobId').value = job.jobId;
  document.getElementById('editServiceStatus').value = job.status;
  document.getElementById('editPaymentStatus').value = job.paymentStatus;
  document.getElementById('editManagerNotes').value = job.notes || '';

  openModal('ownerStatusModal');
}

function saveJobStatusUpdate() {
  const jobId = document.getElementById('editJobId').value;
  const job = jobsData.find(j => j.jobId === jobId);
  if (!job) return;

  job.status = document.getElementById('editServiceStatus').value;
  job.paymentStatus = document.getElementById('editPaymentStatus').value;
  job.notes = document.getElementById('editManagerNotes').value.trim();

  // If completed, remaining amount is paid
  if (job.paymentStatus === 'Completed') {
    job.remainingAmount = 0.00;
  }

  saveJobsToStorage();
  closeModal('ownerStatusModal');
  updateOwnerKPIs();
  renderOwnerJobs();
  renderFinancialReport();
  showToast(`Job ${jobId} updated successfully!`, 'success');
}

/**
 * 3. Owner Rental List (JPEG: "Rental list -> Rental details: price per hour, equipment borrowed")
 */
function renderOwnerRentals() {
  const container = document.getElementById('rentalCardsContainer');
  if (!container) return;

  const rentals = jobsData.filter(j => j.serviceCategory === 'rental');

  if (rentals.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem;">
        <i class="fa-solid fa-toolbox" style="font-size: 2.5rem; color: var(--slate-300); margin-bottom: 0.75rem;"></i>
        <h4>No Active Tool Rentals</h4>
        <p>All cleaning equipment currently in storage at CleanRide depot.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = rentals.map(r => `
    <div class="rental-tool-card">
      <div class="rental-card-top">
        <span class="job-id-tag">${r.jobId}</span>
        <span class="badge ${r.status === 'Completed' ? 'badge-success' : 'badge-warning'}">
          ${r.status === 'Completed' ? 'Returned' : 'Active On-Hire'}
        </span>
      </div>

      <h4 style="font-size: 1.05rem; margin-bottom: 0.35rem;">${r.serviceTitle}</h4>
      <p style="font-size: 0.85rem; color: var(--slate-600); margin-bottom: 0.75rem;">
        <i class="fa-solid fa-user"></i> Renter: <strong>${r.customerName}</strong> (${r.customerPhone})
      </p>

      <div style="background: var(--slate-50); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.82rem; line-height: 1.5; margin-bottom: 0.85rem;">
        <div>&bull; Duration: <strong>${r.details?.hours || 3} Hours</strong></div>
        <div>&bull; Total Rental Fee: <strong>RM ${r.totalPrice.toFixed(2)}</strong></div>
        <div>&bull; Payment Status: <strong>${r.paymentStatus}</strong></div>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-sm btn-secondary flex-1" onclick="viewJobDetails('${r.jobId}')">
          <i class="fa-solid fa-circle-info"></i> View Details
        </button>
        ${r.status !== 'Completed' ? `
          <button class="btn btn-sm btn-primary flex-1" onclick="markRentalReturned('${r.jobId}')">
            <i class="fa-solid fa-arrow-rotate-left"></i> Mark Returned
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function markRentalReturned(jobId) {
  const rental = jobsData.find(j => j.jobId === jobId);
  if (!rental) return;

  rental.status = 'Completed';
  rental.paymentStatus = 'Completed';
  rental.remainingAmount = 0.00;
  saveJobsToStorage();
  updateOwnerKPIs();
  renderOwnerRentals();
  renderFinancialReport();
  showToast(`Rental tool for ${jobId} marked as returned & settled.`, 'success');
}

/**
 * 4. Owner Complaint Desk (JPEG: "Complaint list")
 */
function renderOwnerComplaints() {
  const container = document.getElementById('ownerComplaintList');
  if (!container) return;

  if (complaintsData.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem;">
        <i class="fa-solid fa-comments" style="font-size: 2.5rem; color: var(--slate-300); margin-bottom: 0.75rem;"></i>
        <h4>Zero Customer Grievances</h4>
        <p>Customer satisfaction is currently at 100%.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = complaintsData.map(c => `
    <div class="card">
      <div class="card-header" style="margin-bottom: 0.75rem; padding-bottom: 0.5rem;">
        <div>
          <strong style="font-size: 1rem; color: var(--slate-900);">${c.subject}</strong>
          <div style="font-size: 0.75rem; color: var(--slate-500); font-family: monospace;">
            ID: ${c.complaintId} | Ref: ${c.jobId} | Customer: ${c.customerName}
          </div>
        </div>
        <span class="badge ${c.status === 'Resolved' ? 'badge-success' : 'badge-warning'}">${c.status}</span>
      </div>

      <div style="font-size: 0.85rem; color: var(--slate-700); margin-bottom: 1rem; background: var(--slate-50); padding: 0.75rem; border-radius: var(--radius-sm);">
        <strong>Customer Stated:</strong>
        <p style="margin: 4px 0 0;">${c.details}</p>
      </div>

      ${c.ownerReply ? `
        <div class="complaint-reply-box" style="margin-bottom: 1rem;">
          <strong style="color: var(--primary-700);"><i class="fa-solid fa-check"></i> Resolution Provided:</strong>
          <p style="margin: 3px 0 0; color: var(--slate-700); font-size: 0.82rem;">${c.ownerReply}</p>
        </div>
      ` : ''}

      <button class="btn btn-sm btn-primary" onclick="openComplaintResolveModal('${c.complaintId}')">
        <i class="fa-solid fa-reply"></i> ${c.status === 'Resolved' ? 'Edit Response' : 'Reply & Resolve'}
      </button>
    </div>
  `).join('');
}

function openComplaintResolveModal(complaintId) {
  const complaint = complaintsData.find(c => c.complaintId === complaintId);
  if (!complaint) return;

  document.getElementById('replyComplaintId').value = complaint.complaintId;
  document.getElementById('complaintSummarySnippet').innerHTML = `
    <strong>${complaint.subject} (${complaint.category})</strong>
    <p style="margin: 4px 0 0; font-size: 0.82rem;">Customer: ${complaint.customerName} (Job: ${complaint.jobId})</p>
  `;
  document.getElementById('ownerComplaintReply').value = complaint.ownerReply || '';
  document.getElementById('complaintStatusSelect').value = complaint.status === 'Pending Review' ? 'In Review' : complaint.status;

  openModal('complaintResolveModal');
}

function saveComplaintReply() {
  const cId = document.getElementById('replyComplaintId').value;
  const reply = document.getElementById('ownerComplaintReply').value.trim();
  const status = document.getElementById('complaintStatusSelect').value;

  if (!reply) {
    showToast('Please enter an official response.', 'warning');
    return;
  }

  const complaint = complaintsData.find(c => c.complaintId === cId);
  if (!complaint) return;

  complaint.ownerReply = reply;
  complaint.status = status;

  saveComplaintsToStorage();
  closeModal('complaintResolveModal');
  renderOwnerComplaints();
  updateOwnerKPIs();
  showToast(`Response sent to customer for ${cId}`, 'success');
}

/**
 * 5. Owner Financial Report (JPEG: "Financial report: monthly revenue, job's revenue")
 */
function renderFinancialReport() {
  const validJobs = jobsData.filter(j => j.status !== 'Rejected');

  let totalGross = 0;
  let depositsCollected = 0;
  let faceToFacePaid = 0;
  let pendingBalance = 0;

  const categoryTotals = {
    vehicle: 0,
    furniture: 0,
    carpet: 0,
    rental: 0
  };

  validJobs.forEach(j => {
    totalGross += j.totalPrice;
    depositsCollected += j.depositAmount;

    if (j.paymentStatus === 'Completed') {
      faceToFacePaid += (j.totalPrice - j.depositAmount);
    } else {
      pendingBalance += j.remainingAmount;
    }

    if (categoryTotals[j.serviceCategory] !== undefined) {
      categoryTotals[j.serviceCategory] += j.totalPrice;
    }
  });

  document.getElementById('finTotalGross').textContent = `RM ${totalGross.toFixed(2)}`;
  document.getElementById('finDepositsCollected').textContent = `RM ${depositsCollected.toFixed(2)}`;
  document.getElementById('finFaceToFacePaid').textContent = `RM ${faceToFacePaid.toFixed(2)}`;
  document.getElementById('finPendingBalance').textContent = `RM ${pendingBalance.toFixed(2)}`;

  // Render Category Bars
  const barsContainer = document.getElementById('categoryBars');
  if (barsContainer) {
    const categoriesMeta = [
      { key: 'vehicle', name: 'Vehicle Interior', color: '#0ea5e9' },
      { key: 'furniture', name: 'Sofa & Furniture', color: '#8b5cf6' },
      { key: 'carpet', name: 'Carpet Deep Extraction', color: '#10b981' },
      { key: 'rental', name: 'Equipment Rental Tools', color: '#f59e0b' }
    ];

    barsContainer.innerHTML = categoriesMeta.map(cat => {
      const amount = categoryTotals[cat.key] || 0;
      const percentage = totalGross > 0 ? ((amount / totalGross) * 100).toFixed(1) : 0;

      return `
        <div class="cat-bar-item">
          <div class="cat-bar-header">
            <span>${cat.name}</span>
            <span><strong>RM ${amount.toFixed(2)}</strong> (${percentage}%)</span>
          </div>
          <div class="cat-progress-track">
            <div class="cat-progress-fill" style="width: ${percentage}%; background-color: ${cat.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Recent Transactions
  const txContainer = document.getElementById('recentTransactionsList');
  if (txContainer) {
    const recent = validJobs.slice(0, 5);
    txContainer.innerHTML = recent.map(j => `
      <div class="tx-row">
        <div class="tx-info">
          <strong>${j.jobId} - ${j.serviceTitle}</strong>
          <span>${j.customerName} &bull; ${j.serviceDate} &bull; ${j.paymentStatus}</span>
        </div>
        <div class="tx-amount">
          RM ${j.totalPrice.toFixed(2)}
        </div>
      </div>
    `).join('');
  }
}

function exportFinancialSummary() {
  window.print();
}

/**
 * ================= Modal & Toast Utilities =================
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

// Close modals when clicking overlay
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = '<i class="fa-solid fa-circle-info text-primary"></i>';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check text-success"></i>';
  if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation text-warning"></i>';
  if (type === 'danger') icon = '<i class="fa-solid fa-circle-xmark text-danger"></i>';

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function truncate(str, max = 30) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
