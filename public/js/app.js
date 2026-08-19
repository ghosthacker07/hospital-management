// ==========================================================================
// MEDICORE - CLIENT JAVASCRIPT APPLICATION
// ==========================================================================

const API_BASE = '/api';

// Application State
const state = {
  patients: [],
  doctors: [],
  appointments: [],
  billing: [],
  records: [],
  audits: [],
  summary: {},
  currentView: 'dashboard'
};

let overviewChart = null;

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initMobileMenu();
  loadAllData();
});

// ==========================================
// THEME & NAVIGATION HANDLERS
// ==========================================
function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('medicore_theme') || 'dark';
  
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem('medicore_theme', 'light');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      localStorage.setItem('medicore_theme', 'dark');
    }
    if (overviewChart) renderOverviewChart();
  });
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });
}

function switchView(viewName) {
  state.currentView = viewName;

  // Update Nav Active State
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === viewName);
  });

  // Update View Sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });
  const targetSection = document.getElementById(`view-${viewName}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update Top Bar Title
  const titles = {
    dashboard: 'Dashboard Overview',
    patients: 'Patient Directory',
    doctors: 'Doctor Directory',
    appointments: 'Appointment Scheduling',
    billing: 'Billing & Invoices',
    records: 'Medical Records',
    reports: 'DBMS Reports & Triggers'
  };
  document.getElementById('currentViewTitle').innerText = titles[viewName] || 'Dashboard';

  // Close mobile sidebar if open
  document.getElementById('sidebar').classList.remove('mobile-open');

  // Trigger view specific re-renders
  if (viewName === 'reports') {
    loadReportsData();
  }
}

function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const sidebar = document.getElementById('sidebar');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => sidebar.classList.add('mobile-open'));
  }
  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => sidebar.classList.remove('mobile-open'));
  }
}

// ==========================================
// DATA FETCHING & API SERVICES
// ==========================================
async function loadAllData() {
  try {
    await Promise.all([
      fetchPatients(),
      fetchDoctors(),
      fetchAppointments(),
      fetchBilling(),
      fetchMedicalRecords(),
      fetchSummary(),
      fetchAudits()
    ]);
    renderAllViews();
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('Failed to load initial data from server', 'error');
  }
}

async function fetchPatients() {
  const res = await fetch(`${API_BASE}/patients`);
  state.patients = await res.json();
  document.getElementById('navPatientCount').innerText = state.patients.length;
  populateDropdowns();
}

async function fetchDoctors() {
  const res = await fetch(`${API_BASE}/doctors`);
  state.doctors = await res.json();
  document.getElementById('navDoctorCount').innerText = state.doctors.length;
  populateDropdowns();
}

async function fetchAppointments() {
  const res = await fetch(`${API_BASE}/appointments`);
  state.appointments = await res.json();
  const scheduledCount = state.appointments.filter(a => a.status === 'Scheduled').length;
  document.getElementById('navAppointmentCount').innerText = scheduledCount;
}

async function fetchBilling() {
  const res = await fetch(`${API_BASE}/billing`);
  state.billing = await res.json();
}

async function fetchMedicalRecords() {
  const res = await fetch(`${API_BASE}/medical-records`);
  state.records = await res.json();
}

async function fetchAudits() {
  const res = await fetch(`${API_BASE}/reports/audits`);
  state.audits = await res.json();
}

async function fetchSummary() {
  try {
    const res = await fetch(`${API_BASE}/reports/summary`);
    state.summary = await res.json();
    
    // Update DB status pill
    const statusText = document.getElementById('dbStatusText');
    const dbSub = document.getElementById('dbModeSub');
    if (state.summary.databaseConnected) {
      statusText.innerText = 'MySQL Cloud Live';
      dbSub.innerText = 'Connected: Host';
    } else {
      statusText.innerText = 'Ready & Online';
      dbSub.innerText = 'Cloud / Local Storage';
    }
  } catch (err) {
    console.error('Summary fetch error:', err);
  }
}

// ==========================================
// RENDER VIEWS
// ==========================================
function renderAllViews() {
  renderDashboard();
  renderPatientsTable(state.patients);
  renderDoctorsGrid(state.doctors);
  renderAppointmentsTable(state.appointments);
  renderBillingTable(state.billing);
  renderRecordsGrid(state.records);
}

// 1. Render Dashboard
function renderDashboard() {
  document.getElementById('kpiPatients').innerText = state.patients.length;
  document.getElementById('kpiDoctors').innerText = state.doctors.length;
  document.getElementById('kpiAppointments').innerText = state.appointments.filter(a => a.status === 'Scheduled').length;
  
  const totalRev = state.billing.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
  document.getElementById('kpiRevenue').innerText = `₹${totalRev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Dashboard Recent Appointments (Top 4)
  const previewBody = document.getElementById('dashboardAppointmentsBody');
  const recent = state.appointments.slice(0, 4);
  if (recent.length === 0) {
    previewBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No appointments scheduled yet.</td></tr>`;
  } else {
    previewBody.innerHTML = recent.map(a => `
      <tr>
        <td><strong>${escapeHtml(a.patient_name || 'N/A')}</strong></td>
        <td>${escapeHtml(a.doctor_name || 'N/A')}</td>
        <td><span class="tag">${escapeHtml(a.specialization || 'General')}</span></td>
        <td>${a.appointment_date} <small class="text-muted">${a.appointment_time}</small></td>
        <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
      </tr>
    `).join('');
  }

  // Dashboard Audit Feed
  renderAuditFeed();

  // Overview Chart
  renderOverviewChart();
}

function renderAuditFeed() {
  const feed = document.getElementById('dashboardAuditFeed');
  if (state.audits.length === 0) {
    feed.innerHTML = `<div class="text-muted text-center" style="padding: 1rem;">No trigger audits recorded yet.</div>`;
    return;
  }

  feed.innerHTML = state.audits.slice(0, 5).map(item => `
    <div class="audit-item">
      <div class="audit-icon">
        <i class="fa-solid fa-bolt"></i>
      </div>
      <div class="audit-content">
        <div class="audit-msg">${escapeHtml(item.message)} (Appt #${item.appointment_id})</div>
        <div class="audit-time">${item.created_at || 'Just now'}</div>
      </div>
    </div>
  `).join('');
}

function renderOverviewChart() {
  const ctx = document.getElementById('overviewChart');
  if (!ctx) return;

  if (overviewChart) {
    overviewChart.destroy();
  }

  const isLight = document.body.classList.contains('light-theme');
  const textColor = isLight ? '#475569' : '#94a3b8';

  const scheduled = state.appointments.filter(a => a.status === 'Scheduled').length;
  const completed = state.appointments.filter(a => a.status === 'Completed').length;
  const cancelled = state.appointments.filter(a => a.status === 'Cancelled').length;

  overviewChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Patients', 'Doctors', 'Scheduled', 'Completed', 'Cancelled'],
      datasets: [{
        label: 'Hospital Records',
        data: [
          state.patients.length,
          state.doctors.length,
          scheduled,
          completed,
          cancelled
        ],
        backgroundColor: [
          '#0d9488',
          '#3b82f6',
          '#f59e0b',
          '#10b981',
          '#f43f5e'
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        },
        y: {
          beginAtZero: true,
          grid: { color: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' },
          ticks: { color: textColor, stepSize: 1 }
        }
      }
    }
  });
}

// 2. Render Patients
function renderPatientsTable(list) {
  const tbody = document.getElementById('patientsTableBody');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No patients found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td>#${p.patient_id}</td>
      <td><strong>${escapeHtml(p.patient_name)}</strong></td>
      <td><span class="tag">${escapeHtml(p.gender)}</span></td>
      <td>${p.age} yrs</td>
      <td><i class="fa-solid fa-phone text-muted" style="font-size:0.75rem; margin-right:4px;"></i>${escapeHtml(p.phone)}</td>
      <td>${escapeHtml(p.address)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" title="Edit Patient" onclick="editPatient(${p.patient_id})">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon danger" title="Delete Patient" onclick="deletePatient(${p.patient_id})">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterPatients() {
  const search = document.getElementById('patientSearchInput').value.toLowerCase();
  const gender = document.getElementById('patientGenderFilter').value;

  const filtered = state.patients.filter(p => {
    const matchSearch = p.patient_name.toLowerCase().includes(search) ||
                        p.phone.toLowerCase().includes(search) ||
                        p.address.toLowerCase().includes(search);
    const matchGender = !gender || p.gender === gender;
    return matchSearch && matchGender;
  });

  renderPatientsTable(filtered);
}

// 3. Render Doctors
function renderDoctorsGrid(list) {
  const container = document.getElementById('doctorsGridContainer');
  if (list.length === 0) {
    container.innerHTML = `<div class="text-center text-muted" style="grid-column: 1/-1;">No doctors found.</div>`;
    return;
  }

  container.innerHTML = list.map(d => {
    const initials = d.doctor_name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return `
      <div class="doctor-card">
        <div class="doctor-avatar">${initials}</div>
        <h4>${escapeHtml(d.doctor_name)}</h4>
        <span class="specialty-pill">${escapeHtml(d.specialization)}</span>
        <span class="doctor-phone"><i class="fa-solid fa-phone"></i> ${escapeHtml(d.phone)}</span>
        <div class="doctor-actions">
          <button class="btn btn-sm btn-secondary" onclick="editDoctor(${d.doctor_id})">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button class="btn btn-icon danger" onclick="deleteDoctor(${d.doctor_id})" title="Delete Doctor">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterDoctors() {
  const search = document.getElementById('doctorSearchInput').value.toLowerCase();
  const filtered = state.doctors.filter(d => 
    d.doctor_name.toLowerCase().includes(search) || 
    d.specialization.toLowerCase().includes(search) ||
    d.phone.includes(search)
  );
  renderDoctorsGrid(filtered);
}

// 4. Render Appointments
function renderAppointmentsTable(list) {
  const tbody = document.getElementById('appointmentsTableBody');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No appointments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => `
    <tr>
      <td>#${a.appointment_id}</td>
      <td><strong>${escapeHtml(a.patient_name || 'N/A')}</strong></td>
      <td>${escapeHtml(a.doctor_name || 'N/A')}</td>
      <td><span class="tag">${escapeHtml(a.specialization || 'General')}</span></td>
      <td>${a.appointment_date}</td>
      <td>${a.appointment_time}</td>
      <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
      <td>
        <select onchange="updateAppointmentStatus(${a.appointment_id}, this.value)" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border-radius: 6px;">
          <option value="Scheduled" ${a.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
          <option value="Completed" ${a.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Cancelled" ${a.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function filterAppointments() {
  const search = document.getElementById('appointmentSearchInput').value.toLowerCase();
  const status = document.getElementById('appointmentStatusFilter').value;

  const filtered = state.appointments.filter(a => {
    const matchSearch = (a.patient_name || '').toLowerCase().includes(search) ||
                        (a.doctor_name || '').toLowerCase().includes(search) ||
                        (a.specialization || '').toLowerCase().includes(search);
    const matchStatus = !status || a.status === status;
    return matchSearch && matchStatus;
  });

  renderAppointmentsTable(filtered);
}

// 5. Render Billing
function renderBillingTable(list) {
  const tbody = document.getElementById('billingTableBody');
  
  const total = list.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
  const paid = list.filter(b => b.payment_status === 'Paid').reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
  const pending = list.filter(b => b.payment_status === 'Pending').reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);

  document.getElementById('billBannerTotal').innerText = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('billBannerPaid').innerText = `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('billBannerPending').innerText = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No billing invoices found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(b => `
    <tr>
      <td>#${b.bill_id}</td>
      <td><strong>${escapeHtml(b.patient_name || 'N/A')}</strong></td>
      <td>₹${parseFloat(b.amount).toFixed(2)}</td>
      <td>${b.bill_date}</td>
      <td><span class="status-badge ${b.payment_status.toLowerCase()}">${b.payment_status}</span></td>
      <td>
        <button class="btn btn-sm ${b.payment_status === 'Paid' ? 'btn-ghost' : 'btn-primary'}" onclick="togglePaymentStatus(${b.bill_id}, '${b.payment_status}')">
          <i class="fa-solid ${b.payment_status === 'Paid' ? 'fa-rotate-left' : 'fa-check'}"></i> 
          Mark ${b.payment_status === 'Paid' ? 'Pending' : 'Paid'}
        </button>
      </td>
    </tr>
  `).join('');
}

// 6. Render Medical Records
function renderRecordsGrid(list) {
  const container = document.getElementById('recordsGridContainer');
  if (list.length === 0) {
    container.innerHTML = `<div class="text-center text-muted" style="grid-column: 1/-1;">No clinical records found.</div>`;
    return;
  }

  container.innerHTML = list.map(r => `
    <div class="record-card">
      <div class="record-header">
        <span class="record-patient">${escapeHtml(r.patient_name || 'N/A')}</span>
        <span class="record-date"><i class="fa-regular fa-calendar"></i> ${r.record_date}</span>
      </div>
      <div class="record-doctor">
        <i class="fa-solid fa-user-doctor"></i> ${escapeHtml(r.doctor_name || 'N/A')}
      </div>
      <div class="record-diagnosis">
        <strong>Diagnosis:</strong> ${escapeHtml(r.diagnosis)}
      </div>
      <div class="record-treatment">
        <i class="fa-solid fa-prescription-bottle-medical text-muted"></i> <strong>Treatment:</strong> ${escapeHtml(r.treatment)}
      </div>
    </div>
  `).join('');
}

// 7. Render Reports & Audits
async function loadReportsData() {
  try {
    const [pAbove40Res, auditsRes] = await Promise.all([
      fetch(`${API_BASE}/reports/patients-above-40`),
      fetch(`${API_BASE}/reports/audits`)
    ]);
    const patientsAbove40 = await pAbove40Res.json();
    const audits = await auditsRes.json();

    // Render Patients Above 40
    const p40Body = document.getElementById('patientsAbove40TableBody');
    if (patientsAbove40.length === 0) {
      p40Body.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No patients aged over 40.</td></tr>`;
    } else {
      p40Body.innerHTML = patientsAbove40.map(p => `
        <tr>
          <td><strong>${escapeHtml(p.patient_name)}</strong></td>
          <td><span class="tag">${p.age} yrs</span></td>
          <td>${escapeHtml(p.gender)}</td>
          <td>${escapeHtml(p.phone)}</td>
          <td>${escapeHtml(p.address)}</td>
        </tr>
      `).join('');
    }

    // Render Full Audits Table
    const auditsBody = document.getElementById('auditsTableBody');
    if (audits.length === 0) {
      auditsBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No trigger logs recorded yet.</td></tr>`;
    } else {
      auditsBody.innerHTML = audits.map(a => `
        <tr>
          <td>#${a.audit_id}</td>
          <td>#${a.appointment_id}</td>
          <td><span class="tag tag-accent"><i class="fa-solid fa-bolt"></i> ${escapeHtml(a.message)}</span></td>
          <td>${a.created_at}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading reports:', err);
  }
}

// ==========================================
// MODAL CONTROLS & FORM ACTIONS
// ==========================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
  // Reset edit IDs
  if (modalId === 'patientModal') {
    document.getElementById('patientForm').reset();
    document.getElementById('patientFormId').value = '';
    document.getElementById('patientModalTitle').innerText = 'Add New Patient';
  }
  if (modalId === 'doctorModal') {
    document.getElementById('doctorForm').reset();
    document.getElementById('doctorFormId').value = '';
    document.getElementById('doctorModalTitle').innerText = 'Add New Doctor';
  }
}

function populateDropdowns() {
  const patientSelects = [
    document.getElementById('appPatientSelect'),
    document.getElementById('billPatientSelect'),
    document.getElementById('recPatientSelect')
  ];

  const doctorSelects = [
    document.getElementById('appDoctorSelect'),
    document.getElementById('recDoctorSelect')
  ];

  patientSelects.forEach(select => {
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Choose Patient --</option>' + 
      state.patients.map(p => `<option value="${p.patient_id}">#${p.patient_id} - ${escapeHtml(p.patient_name)}</option>`).join('');
    select.value = currentVal;
  });

  doctorSelects.forEach(select => {
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Choose Doctor --</option>' + 
      state.doctors.map(d => `<option value="${d.doctor_id}">Dr. ${escapeHtml(d.doctor_name)} (${escapeHtml(d.specialization)})</option>`).join('');
    select.value = currentVal;
  });
}

// --- Patient CRUD ---
async function savePatient(e) {
  e.preventDefault();
  const id = document.getElementById('patientFormId').value;
  const payload = {
    patient_name: document.getElementById('patientName').value.trim(),
    gender: document.getElementById('patientGender').value,
    age: parseInt(document.getElementById('patientAge').value),
    phone: document.getElementById('patientPhone').value.trim(),
    address: document.getElementById('patientAddress').value.trim()
  };

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/patients/${id}` : `${API_BASE}/patients`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error || 'Failed to save patient');

    showToast(id ? 'Patient updated successfully' : 'Patient added successfully', 'success');
    closeModal('patientModal');
    await fetchPatients();
    renderPatientsTable(state.patients);
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editPatient(id) {
  const patient = state.patients.find(p => p.patient_id === id);
  if (!patient) return;
  document.getElementById('patientFormId').value = patient.patient_id;
  document.getElementById('patientName').value = patient.patient_name;
  document.getElementById('patientGender').value = patient.gender;
  document.getElementById('patientAge').value = patient.age;
  document.getElementById('patientPhone').value = patient.phone;
  document.getElementById('patientAddress').value = patient.address;
  document.getElementById('patientModalTitle').innerText = 'Edit Patient Details';
  openModal('patientModal');
}

async function deletePatient(id) {
  if (!confirm(`Are you sure you want to delete patient #${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/patients/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete patient');
    
    showToast('Patient deleted successfully', 'success');
    await fetchPatients();
    renderPatientsTable(state.patients);
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Doctor CRUD ---
async function saveDoctor(e) {
  e.preventDefault();
  const id = document.getElementById('doctorFormId').value;
  const payload = {
    doctor_name: document.getElementById('doctorName').value.trim(),
    specialization: document.getElementById('doctorSpecialty').value.trim(),
    phone: document.getElementById('doctorPhone').value.trim()
  };

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/doctors/${id}` : `${API_BASE}/doctors`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error || 'Failed to save doctor');

    showToast(id ? 'Doctor updated successfully' : 'Doctor added successfully', 'success');
    closeModal('doctorModal');
    await fetchDoctors();
    renderDoctorsGrid(state.doctors);
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editDoctor(id) {
  const doctor = state.doctors.find(d => d.doctor_id === id);
  if (!doctor) return;
  document.getElementById('doctorFormId').value = doctor.doctor_id;
  document.getElementById('doctorName').value = doctor.doctor_name;
  document.getElementById('doctorSpecialty').value = doctor.specialization;
  document.getElementById('doctorPhone').value = doctor.phone;
  document.getElementById('doctorModalTitle').innerText = 'Edit Doctor Details';
  openModal('doctorModal');
}

async function deleteDoctor(id) {
  if (!confirm(`Are you sure you want to delete doctor #${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/doctors/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete doctor');
    
    showToast('Doctor deleted successfully', 'success');
    await fetchDoctors();
    renderDoctorsGrid(state.doctors);
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Appointment Actions & Trigger ---
async function saveAppointment(e) {
  e.preventDefault();
  const payload = {
    patient_id: document.getElementById('appPatientSelect').value,
    doctor_id: document.getElementById('appDoctorSelect').value,
    appointment_date: document.getElementById('appDate').value,
    appointment_time: document.getElementById('appTime').value,
    status: document.getElementById('appStatus').value
  };

  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to book appointment');

    showToast('Appointment booked & Trigger Audit recorded! ⚡', 'success');
    closeModal('appointmentModal');
    document.getElementById('appointmentForm').reset();
    await Promise.all([fetchAppointments(), fetchAudits()]);
    renderAppointmentsTable(state.appointments);
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateAppointmentStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update status');
    showToast(`Appointment status changed to ${newStatus}`, 'info');
    await fetchAppointments();
    renderAppointmentsTable(state.appointments);
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Billing Actions & Trigger ---
async function saveBill(e) {
  e.preventDefault();
  const payload = {
    patient_id: document.getElementById('billPatientSelect').value,
    amount: document.getElementById('billAmount').value,
    payment_status: document.getElementById('billPaymentStatus').value,
    bill_date: document.getElementById('billDate').value || null
  };

  try {
    const res = await fetch(`${API_BASE}/billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create bill');

    showToast('Invoice created! (Date trigger executed) 🧾', 'success');
    closeModal('billingModal');
    document.getElementById('billingForm').reset();
    await fetchBilling();
    renderBillingTable(state.billing);
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function togglePaymentStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
  try {
    const res = await fetch(`${API_BASE}/billing/${id}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update payment');
    showToast(`Bill marked as ${newStatus}`, 'success');
    await fetchBilling();
    renderBillingTable(state.billing);
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// --- Medical Records Actions ---
async function saveRecord(e) {
  e.preventDefault();
  const payload = {
    patient_id: document.getElementById('recPatientSelect').value,
    doctor_id: document.getElementById('recDoctorSelect').value,
    diagnosis: document.getElementById('recDiagnosis').value.trim(),
    treatment: document.getElementById('recTreatment').value.trim(),
    record_date: document.getElementById('recDate').value || null
  };

  try {
    const res = await fetch(`${API_BASE}/medical-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to add medical record');

    showToast('Medical record added successfully', 'success');
    closeModal('recordModal');
    document.getElementById('recordForm').reset();
    await fetchMedicalRecords();
    renderRecordsGrid(state.records);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// TOAST NOTIFICATIONS & UTILITIES
// ==========================================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info');
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(msg)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
