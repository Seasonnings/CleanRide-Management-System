/**
 * CleanRide Customer Portal Logic
 * Implements wireframe specifications:
 * - Header: Exit (Left), CleanRide Logo (Center), Profile (Right)
 * - Sidebar: Three-bar toggle at top, no collapse button, compact spacing
 * - Form: Empty full name, no phone, and date (no sample inputs)
 * - Footer: Company name, address, phone number
 */

const STORAGE_KEYS = {
  JOBS: 'cleanride_jobs_data',
  COMPLAINTS: 'cleanride_complaints_data'
};

const OWNER_CONTACT = {
  name: 'CleanRide HQ Operations',
  phone: '+60 12-345 6789',
  address: 'No. 45, Jalan Harmoni 3, Bukit Indah, 79100 Iskandar Puteri, Johor',
  dailyMaxCapacity: 4
};

// Rates aligned with CleanRide PDF
const PRICING = {
  vehicle: {
    sedan: { base: 125, label: 'Vehicle Interior (Personal Sedan - 5 Seats)' },
    suv: { base: 175, label: 'Vehicle Interior (SUV / MPV - 7 Seats)' },
    busSeatRate: 22
  },
  furniture: {
    sofa_1: { price: 50, label: 'Single Recliner / Armchair' },
    sofa_2: { price: 90, label: '2-Seater Fabric Sofa' },
    sofa_3: { price: 140, label: '3-Seater L-Shape Sofa' },
    dining_chair: { price: 70, label: 'Dining Chair Set (4 Chairs)' },
    mattress: { price: 110, label: 'Queen / King Mattress' },
    curtains: { price: 85, label: 'Full Set Window Curtains' }
  },
  carpet: {
    basePerSqM: 8.0,
    materials: { standard: 0, shag: 20, wool: 35 }
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
  depositRate: 0.30
};

// State
let activeCustomer = null;
let jobs = [];
let complaints = [];
let pendingRequestData = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check auth session
  activeCustomer = checkCustomerAuth();
  loadData();
  setupUI();
  initDefaultDate();
  calculateFloatingQuote();
  renderAllViews();
});

function loadData() {
  const storedJobs = localStorage.getItem(STORAGE_KEYS.JOBS);
  const storedComplaints = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);

  if (!storedJobs) {
    const seed = [
      {
        jobId: 'CR-JOB-001',
        customerId: activeCustomer.id,
        customerName: activeCustomer.fullName,
        customerPhone: activeCustomer.phone || '+60 12-889 4432',
        location: 'No 45, Jalan Harmoni 3, Bukit Indah',
        serviceCategory: 'rental',
        serviceTitle: '[Rental] Deep clean - Industrial Spray Extractor',
        serviceDate: '2026-09-18',
        dirtinessLevel: 'light',
        dirtinessMultiplier: 1.0,
        details: { equipment: 'Industrial Spray-Extraction Machine', hours: 4 },
        totalPrice: 100.00,
        depositAmount: 30.00,
        remainingAmount: 70.00,
        status: 'Accepted',
        depositStatus: 'Deposit Paid',
        paymentStatus: 'Deposit Paid',
        ownerPhone: OWNER_CONTACT.phone,
        notes: 'Delivery requested at 9:00 AM.',
        createdAt: '2026-09-10T10:00:00Z'
      },
      {
        jobId: 'CR-JOB-002',
        customerId: activeCustomer.id,
        customerName: activeCustomer.fullName,
        customerPhone: activeCustomer.phone || '+60 12-889 4432',
        location: 'No 45, Jalan Harmoni 3, Bukit Indah',
        serviceCategory: 'carpet',
        serviceTitle: '[Carpet] Wedding prep - 25 m² area extraction',
        serviceDate: '2026-11-03',
        dirtinessLevel: 'medium',
        dirtinessMultiplier: 1.25,
        details: { area: 25, material: 'Shag / High-Pile Luxury Rug' },
        totalPrice: 275.00,
        depositAmount: 82.50,
        remainingAmount: 192.50,
        status: 'Accepted',
        depositStatus: 'Deposit Paid',
        paymentStatus: 'Deposit Paid',
        ownerPhone: OWNER_CONTACT.phone,
        notes: 'Pre-event sanitization for wedding guests.',
        createdAt: '2026-10-15T14:30:00Z'
      },
      {
        jobId: 'CR-JOB-003',
        customerId: activeCustomer.id,
        customerName: activeCustomer.fullName,
        customerPhone: activeCustomer.phone || '+60 12-889 4432',
        location: 'No 45, Jalan Harmoni 3, Bukit Indah',
        serviceCategory: 'vehicle',
        serviceTitle: '[Vehicle] Car clean - Personal Sedan (5 Seats)',
        serviceDate: '2026-12-04',
        dirtinessLevel: 'heavy',
        dirtinessMultiplier: 1.50,
        details: { vehiclePlate: 'VDK 4921', vehicleType: 'sedan' },
        totalPrice: 187.50,
        depositAmount: 56.25,
        remainingAmount: 131.25,
        status: 'Accepted',
        depositStatus: 'Deposit Paid',
        paymentStatus: 'Deposit Paid',
        ownerPhone: OWNER_CONTACT.phone,
        notes: 'Deep shampoo for spilled milk in back row.',
        createdAt: '2026-10-20T09:15:00Z'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(seed));
    jobs = seed;
  } else {
    jobs = JSON.parse(storedJobs);
  }

  if (!storedComplaints) {
    const seedComplaints = [
      {
        complaintId: 'CR-CMP-101',
        jobId: 'CR-JOB-001',
        customerName: activeCustomer.fullName,
        category: 'Missing Item',
        subject: 'Missing item (no response)',
        details: 'The spray nozzle extension attachment was not included with the rented extractor machine.',
        status: 'Pending Review',
        ownerReply: null,
        createdAt: '2026-09-18T16:00:00Z'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(seedComplaints));
    complaints = seedComplaints;
  } else {
    complaints = JSON.parse(storedComplaints);
  }
}

function saveJobs() {
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
}

function saveComplaints() {
  localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
}

function setupUI() {
  // Update header profile details (Right side of header)
  const headerName = document.getElementById('headerUserName');
  const headerEmail = document.getElementById('headerUserEmail');
  const headerAvatar = document.getElementById('headerAvatar');

  if (headerName) headerName.textContent = activeCustomer.fullName || 'Customer Profile';
  if (headerEmail) headerEmail.textContent = activeCustomer.email || 'customer@cleanride.com';
  if (headerAvatar) {
    const initials = (activeCustomer.fullName || 'CU').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    headerAvatar.textContent = initials;
  }

  // Welcome banner on Home
  const homeCust = document.getElementById('homeCustName');
  if (homeCust) homeCust.textContent = activeCustomer.fullName || 'Customer';

  // REQUIREMENT: Empty the full name, no phone, and date (no sample inputs!)
  const nameInput = document.getElementById('reqCustName');
  const phoneInput = document.getElementById('reqCustPhone');
  const dateInput = document.getElementById('reqCustDate');
  const addrInput = document.getElementById('reqCustAddress');

  if (nameInput) nameInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (dateInput) dateInput.value = '';
  if (addrInput) addrInput.value = '';
}

function initDefaultDate() {
  const dateInput = document.getElementById('reqCustDate');
  if (dateInput) {
    // Keep date input empty, but set min to today
    dateInput.value = '';
    dateInput.min = new Date().toISOString().split('T')[0];
  }
}

/**
 * Collapsible Sidebar Logic
 */
function toggleSidebar() {
  const sidebar = document.getElementById('appSidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
  }
}

/**
 * Main Navigation (Home, Request, List, Report)
 */
function navigateTo(pageId) {
  // Update sidebar active buttons
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-page') === pageId);
  });

  // Switch view panels
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const target = document.getElementById(`view-${pageId}`);
  if (target) {
    target.classList.add('active');
  }

  // Refresh page specific views
  if (pageId === 'home') renderHome();
  if (pageId === 'list') renderAppointmentList();
  if (pageId === 'report') renderReportsPage();
  if (pageId === 'request') {
    calculateFloatingQuote();
    checkCapacityForDate();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAllViews() {
  renderHome();
  renderAppointmentList();
  renderReportsPage();
}

/**
 * ================= 1. HOMEPAGE VIEW =================
 */
function renderHome() {
  const myJobs = jobs.filter(j => j.customerId === activeCustomer.id && j.status !== 'Rejected');
  const myComplaints = complaints.filter(c => c.customerName === activeCustomer.fullName);

  const apptCount = myJobs.length;
  const countText = `You have <strong>${apptCount} ${apptCount === 1 ? 'appointment' : 'appointments'}</strong>`;
  
  const summaryEl = document.getElementById('homeApptSummary');
  const badgeEl = document.getElementById('sideApptBadge');
  const homeBadge = document.getElementById('homeUpcomingBadge');

  if (summaryEl) summaryEl.innerHTML = countText;
  if (badgeEl) badgeEl.textContent = apptCount;
  if (homeBadge) homeBadge.textContent = `${apptCount} Scheduled`;

  // Upcoming appoint strip list
  const upcomingContainer = document.getElementById('homeUpcomingList');
  if (upcomingContainer) {
    if (myJobs.length === 0) {
      upcomingContainer.innerHTML = `
        <div class="empty-state-card">
          <i class="fa-solid fa-calendar-xmark"></i>
          <span>No upcoming appointments. Click "Request Service" to book your mobile clean!</span>
        </div>
      `;
    } else {
      upcomingContainer.innerHTML = myJobs.map(job => {
        const formattedDate = formatDateDisplay(job.serviceDate);
        return `
          <div class="strip-item" onclick="viewAppointmentDetails('${job.jobId}')" title="Click to view details">
            <div class="strip-left">
              <span class="strip-date"><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>
              <span class="strip-title">${job.serviceTitle}</span>
            </div>
            <div class="strip-right">
              <span class="badge ${job.status === 'Completed' ? 'badge-success' : 'badge-info'}">${job.status}</span>
              <i class="fa-solid fa-chevron-right strip-arrow"></i>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Report strip list
  const reportContainer = document.getElementById('homeReportList');
  const pendingReportCount = myComplaints.filter(c => c.status !== 'Resolved').length;
  const sideReportBadge = document.getElementById('sideReportBadge');

  if (sideReportBadge) {
    sideReportBadge.style.display = pendingReportCount > 0 ? 'inline-flex' : 'none';
  }

  if (reportContainer) {
    if (myComplaints.length === 0) {
      reportContainer.innerHTML = `
        <div class="empty-state-card">
          <i class="fa-solid fa-circle-check text-success"></i>
          <span>No issues or complaints reported. CleanRide operations are on schedule!</span>
        </div>
      `;
    } else {
      reportContainer.innerHTML = myComplaints.map(c => {
        const isPending = c.status === 'Pending Review';
        return `
          <div class="strip-item strip-alert-item" onclick="navigateTo('report')">
            <div class="strip-left">
              <span class="alert-exclamation"><i class="fa-solid fa-circle-exclamation"></i></span>
              <div>
                <strong class="strip-title">! - ${c.subject} ${isPending ? '(no response yet)' : ''}</strong>
                <small class="strip-sub">Ref: ${c.jobId} &bull; ${formatDateDisplay(c.createdAt)}</small>
              </div>
            </div>
            <span class="badge ${c.status === 'Resolved' ? 'badge-success' : 'badge-warning'}">${c.status}</span>
          </div>
        `;
      }).join('');
    }
  }
}

/**
 * ================= 2. REQUEST SERVICE VIEW =================
 */
function switchCategoryFields() {
  const selectedCat = document.querySelector('input[name="serviceCategory"]:checked')?.value || 'vehicle';
  const cats = ['vehicle', 'furniture', 'carpet', 'rental'];

  cats.forEach(c => {
    const el = document.getElementById(`catBox-${c}`);
    if (el) el.style.display = (c === selectedCat) ? 'block' : 'none';
  });

  const vType = document.getElementById('vType');
  const busRow = document.getElementById('busDetailsRow');
  if (busRow && vType) {
    busRow.style.display = (selectedCat === 'vehicle' && vType.value === 'bus') ? 'flex' : 'none';
  }

  calculateFloatingQuote();
}

document.getElementById('vType')?.addEventListener('change', (e) => {
  const busRow = document.getElementById('busDetailsRow');
  if (busRow) {
    busRow.style.display = (e.target.value === 'bus') ? 'flex' : 'none';
  }
  calculateFloatingQuote();
});

function calculateFloatingQuote() {
  const category = document.querySelector('input[name="serviceCategory"]:checked')?.value || 'vehicle';
  const dirtLevel = document.querySelector('input[name="dirtLevel"]:checked')?.value || 'light';
  const multiplier = PRICING.dirtinessMultipliers[dirtLevel] || 1.0;

  let basePrice = 0;
  let title = '';

  if (category === 'vehicle') {
    const type = document.getElementById('vType')?.value || 'sedan';
    if (type === 'sedan') {
      basePrice = PRICING.vehicle.sedan.base;
      title = 'Vehicle Interior (Personal Sedan - 5 Seats)';
    } else if (type === 'suv') {
      basePrice = PRICING.vehicle.suv.base;
      title = 'Vehicle Interior (SUV / MPV - 7 Seats)';
    } else {
      const fleet = Math.max(1, parseInt(document.getElementById('vFleetCount')?.value || 1));
      const seats = Math.max(1, parseInt(document.getElementById('vFleetSeats')?.value || 30));
      basePrice = fleet * (seats * PRICING.vehicle.busSeatRate);
      title = `Fleet Interior (${fleet} Bus × ${seats} Seats)`;
    }
  } else if (category === 'furniture') {
    const itemKey = document.getElementById('fItem')?.value || 'sofa_1';
    const qty = Math.max(1, parseInt(document.getElementById('fQty')?.value || 1));
    const item = PRICING.furniture[itemKey];
    basePrice = item.price * qty;
    title = `${item.label} (Qty: ${qty})`;
  } else if (category === 'carpet') {
    const area = Math.max(1, parseFloat(document.getElementById('cArea')?.value || 15));
    const matKey = document.getElementById('cType')?.value || 'standard';
    const extra = PRICING.carpet.materials[matKey] || 0;
    basePrice = (area * PRICING.carpet.basePerSqM) + extra;
    title = `Carpet Deep Extraction (${area} m² area)`;
  } else if (category === 'rental') {
    const toolKey = document.getElementById('rTool')?.value || 'extractor';
    const hours = Math.max(1, parseInt(document.getElementById('rHours')?.value || 3));
    const tool = PRICING.rental[toolKey];
    basePrice = tool.rate * hours;
    title = `Equipment Rental: ${tool.label} (${hours} hrs)`;
  }

  const effectiveMultiplier = (category === 'rental') ? 1.0 : multiplier;
  const totalPrice = basePrice * effectiveMultiplier;
  const depositPrice = totalPrice * PRICING.depositRate;
  const remainingPrice = totalPrice - depositPrice;

  // Update floating cost window
  const titleEl = document.getElementById('fltServiceTitle');
  const baseEl = document.getElementById('fltBasePrice');
  const dirtEl = document.getElementById('fltDirtLevel');
  const multEl = document.getElementById('fltDirtMultiplier');
  const totalEl = document.getElementById('fltTotalPrice');
  const depEl = document.getElementById('fltDepositPrice');
  const remEl = document.getElementById('fltRemainingPrice');

  if (titleEl) titleEl.textContent = title;
  if (baseEl) baseEl.textContent = `RM ${basePrice.toFixed(2)}`;
  if (dirtEl) dirtEl.textContent = capitalize(dirtLevel);
  if (multEl) multEl.textContent = `${effectiveMultiplier.toFixed(2)}x`;
  if (totalEl) totalEl.textContent = `RM ${totalPrice.toFixed(2)}`;
  if (depEl) depEl.textContent = `RM ${depositPrice.toFixed(2)}`;
  if (remEl) remEl.textContent = `RM ${remainingPrice.toFixed(2)}`;

  return {
    category,
    title,
    basePrice,
    multiplier: effectiveMultiplier,
    dirtLevel,
    totalPrice,
    depositPrice,
    remainingPrice
  };
}

/**
 * Capacity validation
 */
function checkCapacityForDate() {
  const dateInput = document.getElementById('reqCustDate');
  const notice = document.getElementById('reqCapacityNotice');
  const btn = document.getElementById('btnRequestSubmit');
  if (!dateInput || !notice) return true;

  const dateVal = dateInput.value;
  if (!dateVal) {
    notice.innerHTML = '';
    if (btn) btn.disabled = false;
    return true;
  }

  const bookingsOnDate = jobs.filter(j => j.serviceDate === dateVal && j.status !== 'Rejected').length;
  const max = OWNER_CONTACT.dailyMaxCapacity;

  if (bookingsOnDate >= max) {
    notice.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Daily limit reached (${bookingsOnDate}/${max}). CleanRide daily capacity is full on this day. Please select another date.</span>`;
    if (btn) btn.disabled = true;
    return false;
  } else {
    notice.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check"></i> ${bookingsOnDate}/${max} slots booked. Capacity available for mobile travel.</span>`;
    if (btn) btn.disabled = false;
    return true;
  }
}

/**
 * Handle Request Form Submit
 */
function handleRequestSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('reqCustName').value.trim();
  const phone = document.getElementById('reqCustPhone').value.trim();
  const address = document.getElementById('reqCustAddress').value.trim();
  const date = document.getElementById('reqCustDate').value;
  const instructions = document.getElementById('reqSpecialInstructions').value.trim();

  // Validate user provided required information
  if (!name || !phone || !address || !date) {
    showToast('Please fill in your full name, phone number, service address, and date.', 'warning');
    return;
  }

  if (!checkCapacityForDate()) {
    showToast('Daily capacity cap reached. Please pick another date.', 'danger');
    return;
  }

  const quote = calculateFloatingQuote();

  let details = {};
  if (quote.category === 'vehicle') {
    details.vehiclePlate = document.getElementById('vPlate').value.trim() || 'WXX 1234';
    details.vehicleType = document.getElementById('vType').value;
  } else if (quote.category === 'furniture') {
    details.furnitureType = document.getElementById('fItem').value;
    details.quantity = parseInt(document.getElementById('fQty').value || 1);
  } else if (quote.category === 'carpet') {
    details.area = parseFloat(document.getElementById('cArea').value || 15);
    details.material = document.getElementById('cType').value;
  } else if (quote.category === 'rental') {
    details.equipment = document.getElementById('rTool').value;
    details.hours = parseInt(document.getElementById('rHours').value || 3);
  }

  const generatedRef = `CR-JOB-00${jobs.length + 1}`;

  pendingRequestData = {
    jobId: generatedRef,
    customerId: activeCustomer.id,
    customerName: name,
    customerPhone: phone,
    location: address,
    serviceDate: date,
    serviceCategory: quote.category,
    serviceTitle: `[${capitalize(quote.category)}] ${quote.title}`,
    dirtinessLevel: quote.dirtLevel,
    dirtinessMultiplier: quote.multiplier,
    details: details,
    totalPrice: quote.totalPrice,
    depositAmount: quote.depositPrice,
    remainingAmount: quote.remainingPrice,
    status: 'Accepted',
    depositStatus: 'Deposit Paid',
    paymentStatus: 'Deposit Paid',
    ownerPhone: OWNER_CONTACT.phone,
    notes: instructions,
    createdAt: new Date().toISOString()
  };

  // Populate Payment Pop Out Window
  document.getElementById('payModalRef').textContent = generatedRef;
  document.getElementById('payModalDepositVal').textContent = `RM ${quote.depositPrice.toFixed(2)}`;
  document.getElementById('payModalCardName').value = name;

  openModal('popPaymentModal');
}

/**
 * Confirm Payment & Create Job
 */
function confirmPaymentAndCreateJob() {
  if (!pendingRequestData) return;

  const btn = document.getElementById('btnSubmitDepositPay');
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
  btn.disabled = true;

  setTimeout(() => {
    jobs.unshift(pendingRequestData);
    saveJobs();

    closeModal('popPaymentModal');
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Submit Deposit Payment`;
    btn.disabled = false;

    showToast(`Payment successful! Booking reference ${pendingRequestData.jobId} confirmed.`, 'success');

    // Reset Form - Keep inputs empty
    document.getElementById('custBookingForm').reset();
    document.getElementById('reqCustName').value = '';
    document.getElementById('reqCustPhone').value = '';
    document.getElementById('reqCustDate').value = '';
    document.getElementById('reqCustAddress').value = '';
    calculateFloatingQuote();
    checkCapacityForDate();

    // Re-render and navigate to appointment list
    renderAllViews();
    navigateTo('list');
    pendingRequestData = null;
  }, 900);
}

/**
 * ================= 3. DISPLAY APPOINTMENT LIST VIEW =================
 */
function renderAppointmentList() {
  const container = document.getElementById('appointmentListContainer');
  const title = document.getElementById('apptListTitle');
  if (!container) return;

  const myJobs = jobs.filter(j => j.customerId === activeCustomer.id);
  title.textContent = `You have ${myJobs.length} upcoming ${myJobs.length === 1 ? 'appointment' : 'appointments'}`;

  if (myJobs.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
        <i class="fa-solid fa-calendar-xmark" style="font-size: 2.5rem; color: var(--slate-300); margin-bottom: 1rem;"></i>
        <h3>No Appointments Scheduled</h3>
        <p>You have not made any service bookings yet.</p>
        <button class="btn btn-primary" style="margin-top: 1rem;" onclick="navigateTo('request')">
          <i class="fa-solid fa-calendar-plus"></i> Request Service Now
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = myJobs.map((job, idx) => {
    const formattedDate = formatDateDisplay(job.serviceDate);
    const countdown = getCountdownBadge(job.serviceDate);

    return `
      <div class="appointment-row-card">
        <div class="appt-main-info">
          <div class="appt-top-line">
            <span class="appt-index-label">Appointment ${idx + 1}</span>
            <span class="appt-ref-tag">${job.jobId}</span>
            ${countdown}
          </div>
          <h3 class="appt-service-name">${job.serviceTitle}</h3>
          <div class="appt-meta-pills">
            <span><i class="fa-solid fa-calendar"></i> ${formattedDate}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${truncate(job.location, 35)}</span>
            <span><i class="fa-solid fa-receipt"></i> Total: <strong>RM ${job.totalPrice.toFixed(2)}</strong></span>
            <span><i class="fa-solid fa-shield-check"></i> ${job.paymentStatus}</span>
          </div>
        </div>

        <div class="appt-actions">
          <button class="btn btn-primary btn-appt-details" onclick="viewAppointmentDetails('${job.jobId}')">
            <i class="fa-regular fa-file-lines"></i> Details
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Details Pop-Out Window
 */
function viewAppointmentDetails(jobId) {
  const job = jobs.find(j => j.jobId === jobId);
  if (!job) return;

  const formattedDate = formatDateDisplay(job.serviceDate);
  const countdown = getCountdownBadge(job.serviceDate);

  document.getElementById('popApptModalTitle').textContent = `Appointment Details: ${job.jobId}`;
  const body = document.getElementById('popApptModalBody');

  body.innerHTML = `
    <div class="modal-detail-grid">
      <div class="detail-box">
        <span class="box-tag">Appointment Schedule</span>
        <div class="date-large">${formattedDate}</div>
        <div style="margin-top: 6px;">Countdown: ${countdown}</div>
        <div style="font-size: 0.82rem; color: var(--slate-600); margin-top: 8px;">
          <i class="fa-solid fa-location-dot"></i> Address: <strong>${job.location}</strong>
        </div>
      </div>

      <div class="detail-box">
        <span class="box-tag">CleanRide Owner & Team</span>
        <div style="font-weight: 700; margin: 4px 0;">CleanRide Mobile Extraction Unit</div>
        <div style="font-size: 0.85rem; color: var(--slate-700); margin-top: 4px;">
          <i class="fa-solid fa-phone text-primary"></i> Owner Phone: <strong>${job.ownerPhone}</strong>
        </div>
        <a href="tel:${job.ownerPhone}" class="btn btn-sm btn-secondary" style="margin-top: 8px; display: inline-flex;">
          <i class="fa-solid fa-phone"></i> Call Operations Team
        </a>
      </div>
    </div>

    <div class="card detail-content-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h4 style="margin: 0; font-size: 1.1rem;"><i class="fa-solid fa-wand-magic-sparkles text-primary"></i> ${job.serviceTitle}</h4>
        <span class="badge badge-info">${job.serviceCategory.toUpperCase()}</span>
      </div>

      <div class="specs-list">
        <div>&bull; Dirtiness Condition: <strong>${capitalize(job.dirtinessLevel)} (${job.dirtinessMultiplier}x rate)</strong></div>
        ${job.details?.vehiclePlate ? `<div>&bull; Vehicle Plate No: <strong>${job.details.vehiclePlate}</strong></div>` : ''}
        ${job.details?.hours ? `<div>&bull; Rental Tool Duration: <strong>${job.details.hours} Hours</strong></div>` : ''}
        ${job.details?.area ? `<div>&bull; Area Cleaned: <strong>${job.details.area} m²</strong></div>` : ''}
        ${job.notes ? `<div>&bull; Special Instructions: <em>"${job.notes}"</em></div>` : ''}
      </div>
    </div>

    <div class="payment-pop-breakdown">
      <div class="p-row">
        <span>Total Service Cost:</span>
        <strong>RM ${job.totalPrice.toFixed(2)}</strong>
      </div>
      <div class="p-row">
        <span>Online Deposit Paid:</span>
        <span class="text-success" style="font-weight: 700;">RM ${job.depositAmount.toFixed(2)}</span>
      </div>
      <div class="p-row">
        <span>Remaining Payable (Face-to-Face):</span>
        <strong class="text-primary">RM ${job.remainingAmount.toFixed(2)}</strong>
      </div>
      <div class="p-divider"></div>
      <div class="p-status-row">
        <span>Appointment Status: <strong class="text-info">${job.status}</strong></span>
        <span>Payment Settlement: <strong class="text-success">${job.paymentStatus}</strong></span>
      </div>
    </div>
  `;

  openModal('popApptDetailsModal');
}

/**
 * ================= 4. LODGE COMPLAINT / REPORT VIEW =================
 */
function renderReportsPage() {
  populateReportDropdown();
  renderSubmittedReportsFeed();
}

function populateReportDropdown() {
  const select = document.getElementById('reportApptSelect');
  if (!select) return;

  const myJobs = jobs.filter(j => j.customerId === activeCustomer.id);
  if (myJobs.length === 0) {
    select.innerHTML = '<option value="">No appointments found</option>';
    return;
  }

  select.innerHTML = myJobs.map(j => `
    <option value="${j.jobId}">${j.jobId} - ${j.serviceTitle} (${formatDateDisplay(j.serviceDate)})</option>
  `).join('');
}

function handleReportSubmit(e) {
  e.preventDefault();

  const jobId = document.getElementById('reportApptSelect').value;
  const category = document.getElementById('reportCategory').value;
  const subject = document.getElementById('reportSubject').value.trim();
  const details = document.getElementById('reportDetails').value.trim();

  if (!jobId) {
    showToast('Please select an appointment reference.', 'warning');
    return;
  }

  const newReport = {
    complaintId: `CR-CMP-${Math.floor(100 + Math.random() * 900)}`,
    jobId,
    customerName: activeCustomer.fullName,
    category,
    subject,
    details,
    status: 'Pending Review',
    ownerReply: null,
    createdAt: new Date().toISOString()
  };

  complaints.unshift(newReport);
  saveComplaints();

  showToast(`Report ${newReport.complaintId} submitted! Management will follow up.`, 'success');
  document.getElementById('lodgeReportForm').reset();
  renderAllViews();
}

function renderSubmittedReportsFeed() {
  const container = document.getElementById('submittedReportsContainer');
  if (!container) return;

  const myComplaints = complaints.filter(c => c.customerName === activeCustomer.fullName);

  if (myComplaints.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card" style="padding: 2.5rem 1rem;">
        <i class="fa-solid fa-inbox"></i>
        <span>No submitted reports. If you experience any issues, use the form on the left!</span>
      </div>
    `;
    return;
  }

  container.innerHTML = myComplaints.map(c => `
    <div class="report-feed-card">
      <div class="report-card-top">
        <div>
          <strong class="rep-title">${c.subject}</strong>
          <div class="rep-meta">Ref: <strong>${c.jobId}</strong> &bull; Category: ${c.category}</div>
        </div>
        <span class="badge ${c.status === 'Resolved' ? 'badge-success' : 'badge-warning'}">${c.status}</span>
      </div>

      <p class="rep-description">${c.details}</p>

      ${c.ownerReply ? `
        <div class="rep-reply-box">
          <strong><i class="fa-solid fa-reply"></i> Manager Response:</strong>
          <p>${c.ownerReply}</p>
        </div>
      ` : `
        <div class="rep-waiting-note">
          <i class="fa-regular fa-clock"></i> Pending owner review & action
        </div>
      `}
    </div>
  `).join('');
}

/**
 * ================= MODALS & EXIT =================
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// Close on background click
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

function handleExit() {
  if (confirm('Are you sure you want to exit and log out?')) {
    if (typeof logoutUser === 'function') {
      logoutUser();
    } else {
      localStorage.removeItem('cleanride_session');
      window.location.href = '../login.html';
    }
  }
}

/**
 * ================= UTILITIES =================
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  let icon = '<i class="fa-solid fa-circle-info"></i>';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check text-success"></i>';
  if (type === 'danger') icon = '<i class="fa-solid fa-circle-xmark text-danger"></i>';
  if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation text-warning"></i>';

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function getCountdownBadge(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '<span class="badge badge-alert">Today</span>';
  if (diffDays === 1) return '<span class="badge badge-warning">Tomorrow</span>';
  if (diffDays > 1) return `<span class="badge badge-info">In ${diffDays} days</span>`;
  return `<span class="badge badge-success">Completed</span>`;
}

function truncate(str, max = 30) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
