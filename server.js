const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database configuration
const isCloudHost = process.env.DB_HOST && (process.env.DB_HOST.includes('tidbcloud') || process.env.DB_HOST.includes('aiven') || process.env.DB_SSL === 'true');

const dbConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'YOUR_MYSQL_PASSWORD',
      database: process.env.DB_NAME || 'HospitalDB',
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: isCloudHost ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

let pool = null;
let useDatabase = false;

// Fallback in-memory / file-backed persistent store (ensures zero-downtime & instant preview)
const DATA_FILE = path.join(__dirname, 'hospital_data.json');

const defaultData = {
  patients: [
    { patient_id: 1, patient_name: 'Rohan Kumar', gender: 'Male', age: 25, phone: '9876543210', address: 'Lucknow' },
    { patient_id: 2, patient_name: 'Priya Singh', gender: 'Female', age: 30, phone: '9876543211', address: 'Kanpur' },
    { patient_id: 3, patient_name: 'Amit Verma', gender: 'Male', age: 45, phone: '9876543212', address: 'Azamgarh' },
    { patient_id: 4, patient_name: 'Neha Sharma', gender: 'Female', age: 28, phone: '9876543213', address: 'Delhi' },
    { patient_id: 5, patient_name: 'Vikram Malhotra', gender: 'Male', age: 52, phone: '9876543214', address: 'Mumbai' }
  ],
  doctors: [
    { doctor_id: 1, doctor_name: 'Dr. Raj Sharma', specialization: 'Cardiologist', phone: '9123456780' },
    { doctor_id: 2, doctor_name: 'Dr. Priya Verma', specialization: 'Dermatologist', phone: '9123456781' },
    { doctor_id: 3, doctor_name: 'Dr. Amit Singh', specialization: 'Orthopedic', phone: '9123456782' },
    { doctor_id: 4, doctor_name: 'Dr. Sunita Rao', specialization: 'Neurologist', phone: '9123456783' },
    { doctor_id: 5, doctor_name: 'Dr. Ananya Roy', specialization: 'Pediatrician', phone: '9123456784' }
  ],
  appointments: [
    { appointment_id: 1, patient_id: 1, doctor_id: 1, appointment_date: '2026-08-20', appointment_time: '10:00:00', status: 'Scheduled' },
    { appointment_id: 2, patient_id: 2, doctor_id: 2, appointment_date: '2026-08-21', appointment_time: '11:30:00', status: 'Scheduled' },
    { appointment_id: 3, patient_id: 3, doctor_id: 3, appointment_date: '2026-08-22', appointment_time: '14:00:00', status: 'Completed' }
  ],
  billing: [
    { bill_id: 1, patient_id: 1, amount: 2500.00, payment_status: 'Paid', bill_date: '2026-08-19' },
    { bill_id: 2, patient_id: 2, amount: 1500.00, payment_status: 'Pending', bill_date: '2026-08-19' },
    { bill_id: 3, patient_id: 3, amount: 4800.00, payment_status: 'Paid', bill_date: '2026-08-18' }
  ],
  medical_records: [
    { record_id: 1, patient_id: 1, doctor_id: 1, diagnosis: 'Hypertension Stage 1', treatment: 'Amlodipine 5mg daily & low sodium diet', record_date: '2026-08-19' },
    { record_id: 2, patient_id: 2, doctor_id: 2, diagnosis: 'Contact Dermatitis', treatment: 'Hydrocortisone cream & antihistamines', record_date: '2026-08-18' }
  ],
  appointment_audits: [
    { audit_id: 1, appointment_id: 1, message: 'New appointment created', created_at: '2026-08-19 10:00:00' },
    { audit_id: 2, appointment_id: 2, message: 'New appointment created', created_at: '2026-08-19 11:30:00' },
    { audit_id: 3, appointment_id: 3, message: 'New appointment created', created_at: '2026-08-19 14:00:00' }
  ]
};

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  saveStore(defaultData);
  return defaultData;
}

function saveStore(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving data file:', err);
  }
}

let store = loadStore();

// Attempt MySQL connection if configured
async function initDB() {
  try {
    const testPool = mysql.createPool(dbConfig);
    const [rows] = await testPool.query('SELECT 1');
    pool = testPool;
    useDatabase = true;
    console.log('✅ Connected to MySQL Database successfully.');
  } catch (err) {
    console.log('ℹ️  MySQL not detected or unreachable (' + err.message + ').');
    console.log('🚀 Running in Local Persistent Mode (Fully compatible with all features, triggers & schema).');
    useDatabase = false;
  }
}

initDB();

// ==========================================
// 1. PATIENTS API (CRUD)
// ==========================================
app.get('/api/patients', async (req, res) => {
  try {
    if (useDatabase) {
      const [rows] = await pool.query('SELECT * FROM Patient ORDER BY patient_id ASC');
      return res.json(rows);
    }
    res.json(store.patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const { patient_name, gender, age, phone, address } = req.body;
    if (!patient_name) return res.status(400).json({ error: 'Patient name is required' });

    if (useDatabase) {
      const [result] = await pool.query(
        'INSERT INTO Patient (patient_name, gender, age, phone, address) VALUES (?, ?, ?, ?, ?)',
        [patient_name, gender, age, phone, address]
      );
      return res.status(201).json({ message: 'Patient added successfully', patient_id: result.insertId });
    }

    const newId = store.patients.length > 0 ? Math.max(...store.patients.map(p => p.patient_id)) + 1 : 1;
    const newPatient = { patient_id: newId, patient_name, gender, age: parseInt(age) || 0, phone, address };
    store.patients.push(newPatient);
    saveStore(store);
    res.status(201).json({ message: 'Patient added successfully', patient: newPatient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { patient_name, gender, age, phone, address } = req.body;

    if (useDatabase) {
      const [result] = await pool.query(
        'UPDATE Patient SET patient_name=?, gender=?, age=?, phone=?, address=? WHERE patient_id=?',
        [patient_name, gender, age, phone, address, id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Patient not found' });
      return res.json({ message: 'Patient updated successfully' });
    }

    const index = store.patients.findIndex(p => p.patient_id === id);
    if (index === -1) return res.status(404).json({ error: 'Patient not found' });
    store.patients[index] = { patient_id: id, patient_name, gender, age: parseInt(age) || 0, phone, address };
    saveStore(store);
    res.json({ message: 'Patient updated successfully', patient: store.patients[index] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (useDatabase) {
      const [result] = await pool.query('DELETE FROM Patient WHERE patient_id=?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Patient not found' });
      return res.json({ message: 'Patient deleted successfully' });
    }

    // Check foreign keys
    const hasAppointments = store.appointments.some(a => a.patient_id === id);
    const hasBilling = store.billing.some(b => b.patient_id === id);
    if (hasAppointments || hasBilling) {
      return res.status(400).json({ error: 'Cannot delete: Patient has related appointments or billing records.' });
    }

    const initialLen = store.patients.length;
    store.patients = store.patients.filter(p => p.patient_id !== id);
    if (store.patients.length === initialLen) return res.status(404).json({ error: 'Patient not found' });
    saveStore(store);
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Cannot delete: patient may have related records.' });
  }
});

// ==========================================
// 2. DOCTORS API (CRUD)
// ==========================================
app.get('/api/doctors', async (req, res) => {
  try {
    if (useDatabase) {
      const [rows] = await pool.query('SELECT * FROM Doctor ORDER BY doctor_id ASC');
      return res.json(rows);
    }
    res.json(store.doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const { doctor_name, specialization, phone } = req.body;
    if (!doctor_name) return res.status(400).json({ error: 'Doctor name is required' });

    if (useDatabase) {
      const [result] = await pool.query(
        'INSERT INTO Doctor (doctor_name, specialization, phone) VALUES (?, ?, ?)',
        [doctor_name, specialization, phone]
      );
      return res.status(201).json({ message: 'Doctor added successfully', doctor_id: result.insertId });
    }

    const newId = store.doctors.length > 0 ? Math.max(...store.doctors.map(d => d.doctor_id)) + 1 : 1;
    const newDoctor = { doctor_id: newId, doctor_name, specialization, phone };
    store.doctors.push(newDoctor);
    saveStore(store);
    res.status(201).json({ message: 'Doctor added successfully', doctor: newDoctor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { doctor_name, specialization, phone } = req.body;

    if (useDatabase) {
      const [result] = await pool.query(
        'UPDATE Doctor SET doctor_name=?, specialization=?, phone=? WHERE doctor_id=?',
        [doctor_name, specialization, phone, id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Doctor not found' });
      return res.json({ message: 'Doctor updated successfully' });
    }

    const index = store.doctors.findIndex(d => d.doctor_id === id);
    if (index === -1) return res.status(404).json({ error: 'Doctor not found' });
    store.doctors[index] = { doctor_id: id, doctor_name, specialization, phone };
    saveStore(store);
    res.json({ message: 'Doctor updated successfully', doctor: store.doctors[index] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (useDatabase) {
      const [result] = await pool.query('DELETE FROM Doctor WHERE doctor_id=?', [id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Doctor not found' });
      return res.json({ message: 'Doctor deleted successfully' });
    }

    const hasAppointments = store.appointments.some(a => a.doctor_id === id);
    if (hasAppointments) {
      return res.status(400).json({ error: 'Cannot delete: Doctor has existing appointments.' });
    }

    const initialLen = store.doctors.length;
    store.doctors = store.doctors.filter(d => d.doctor_id !== id);
    if (store.doctors.length === initialLen) return res.status(404).json({ error: 'Doctor not found' });
    saveStore(store);
    res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Cannot delete: doctor may have related records.' });
  }
});

// ==========================================
// 3. APPOINTMENTS API (WITH JOIN & TRIGGER)
// ==========================================
app.get('/api/appointments', async (req, res) => {
  try {
    if (useDatabase) {
      const sql = `SELECT a.appointment_id, a.patient_id, a.doctor_id, p.patient_name, d.doctor_name, d.specialization,
                   DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date, 
                   a.appointment_time, a.status 
                   FROM Appointment a 
                   JOIN Patient p ON a.patient_id=p.patient_id 
                   JOIN Doctor d ON a.doctor_id=d.doctor_id 
                   ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
      const [rows] = await pool.query(sql);
      return res.json(rows);
    }

    // JOIN emulation
    const joined = store.appointments.map(a => {
      const patient = store.patients.find(p => p.patient_id === a.patient_id) || {};
      const doctor = store.doctors.find(d => d.doctor_id === a.doctor_id) || {};
      return {
        ...a,
        patient_name: patient.patient_name || 'Unknown Patient',
        doctor_name: doctor.doctor_name || 'Unknown Doctor',
        specialization: doctor.specialization || 'General'
      };
    }).sort((a, b) => (b.appointment_date + b.appointment_time).localeCompare(a.appointment_date + a.appointment_time));

    res.json(joined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, status } = req.body;

    if (useDatabase) {
      const [result] = await pool.query(
        'INSERT INTO Appointment (patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?)',
        [patient_id, doctor_id, appointment_date, appointment_time, status || 'Scheduled']
      );
      // appointment_audit_trigger runs automatically in MySQL
      return res.status(201).json({ message: 'Appointment created & audit trigger fired', appointment_id: result.insertId });
    }

    const newId = store.appointments.length > 0 ? Math.max(...store.appointments.map(a => a.appointment_id)) + 1 : 1;
    const newAppointment = {
      appointment_id: newId,
      patient_id: parseInt(patient_id),
      doctor_id: parseInt(doctor_id),
      appointment_date,
      appointment_time,
      status: status || 'Scheduled'
    };
    store.appointments.push(newAppointment);

    // Emulate appointment_audit_trigger
    const auditId = store.appointment_audits.length > 0 ? Math.max(...store.appointment_audits.map(au => au.audit_id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    store.appointment_audits.unshift({
      audit_id: auditId,
      appointment_id: newId,
      message: 'New appointment created',
      created_at: now
    });

    saveStore(store);
    res.status(201).json({ message: 'Appointment created & audit trigger recorded', appointment: newAppointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (useDatabase) {
      const [result] = await pool.query('UPDATE Appointment SET status=? WHERE appointment_id=?', [status, id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Appointment not found' });
      return res.json({ message: 'Status updated successfully' });
    }

    const appointment = store.appointments.find(a => a.appointment_id === id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    appointment.status = status;
    saveStore(store);
    res.json({ message: 'Status updated successfully', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. BILLING API (WITH TRIGGER)
// ==========================================
app.get('/api/billing', async (req, res) => {
  try {
    if (useDatabase) {
      const sql = `SELECT b.bill_id, b.patient_id, p.patient_name, b.amount, b.payment_status, 
                   DATE_FORMAT(b.bill_date, '%Y-%m-%d') as bill_date 
                   FROM Billing b 
                   JOIN Patient p ON b.patient_id=p.patient_id 
                   ORDER BY b.bill_id DESC`;
      const [rows] = await pool.query(sql);
      return res.json(rows);
    }

    const joined = store.billing.map(b => {
      const patient = store.patients.find(p => p.patient_id === b.patient_id) || {};
      return {
        ...b,
        patient_name: patient.patient_name || 'Unknown Patient'
      };
    }).sort((a, b) => b.bill_id - a.bill_id);

    res.json(joined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing', async (req, res) => {
  try {
    let { patient_id, amount, payment_status, bill_date } = req.body;

    if (useDatabase) {
      // bill_date_trigger sets CURDATE() if NULL
      const [result] = await pool.query(
        'INSERT INTO Billing (patient_id, amount, payment_status, bill_date) VALUES (?, ?, ?, ?)',
        [patient_id, amount, payment_status || 'Pending', bill_date || null]
      );
      return res.status(201).json({ message: 'Bill created. Trigger set bill date automatically.', bill_id: result.insertId });
    }

    // Emulate bill_date_trigger
    if (!bill_date) {
      bill_date = new Date().toISOString().split('T')[0];
    }

    const newId = store.billing.length > 0 ? Math.max(...store.billing.map(b => b.bill_id)) + 1 : 1;
    const newBill = {
      bill_id: newId,
      patient_id: parseInt(patient_id),
      amount: parseFloat(amount),
      payment_status: payment_status || 'Pending',
      bill_date
    };
    store.billing.push(newBill);
    saveStore(store);
    res.status(201).json({ message: 'Bill created. Trigger set bill date automatically.', bill: newBill });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/billing/:id/payment', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { payment_status } = req.body;

    if (useDatabase) {
      const [result] = await pool.query('UPDATE Billing SET payment_status=? WHERE bill_id=?', [payment_status, id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Bill not found' });
      return res.json({ message: 'Payment status updated' });
    }

    const bill = store.billing.find(b => b.bill_id === id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    bill.payment_status = payment_status;
    saveStore(store);
    res.json({ message: 'Payment status updated', bill });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. MEDICAL RECORDS API
// ==========================================
app.get('/api/medical-records', async (req, res) => {
  try {
    if (useDatabase) {
      const sql = `SELECT m.record_id, m.patient_id, m.doctor_id, p.patient_name, d.doctor_name, 
                   m.diagnosis, m.treatment, DATE_FORMAT(m.record_date, '%Y-%m-%d') as record_date 
                   FROM Medical_Record m 
                   JOIN Patient p ON m.patient_id=p.patient_id 
                   JOIN Doctor d ON m.doctor_id=d.doctor_id 
                   ORDER BY m.record_id DESC`;
      const [rows] = await pool.query(sql);
      return res.json(rows);
    }

    const joined = store.medical_records.map(m => {
      const patient = store.patients.find(p => p.patient_id === m.patient_id) || {};
      const doctor = store.doctors.find(d => d.doctor_id === m.doctor_id) || {};
      return {
        ...m,
        patient_name: patient.patient_name || 'Unknown Patient',
        doctor_name: doctor.doctor_name || 'Unknown Doctor'
      };
    }).sort((a, b) => b.record_id - a.record_id);

    res.json(joined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medical-records', async (req, res) => {
  try {
    let { patient_id, doctor_id, diagnosis, treatment, record_date } = req.body;
    if (!record_date) record_date = new Date().toISOString().split('T')[0];

    if (useDatabase) {
      const [result] = await pool.query(
        'INSERT INTO Medical_Record (patient_id, doctor_id, diagnosis, treatment, record_date) VALUES (?, ?, ?, ?, ?)',
        [patient_id, doctor_id, diagnosis, treatment, record_date]
      );
      return res.status(201).json({ message: 'Medical record added successfully', record_id: result.insertId });
    }

    const newId = store.medical_records.length > 0 ? Math.max(...store.medical_records.map(m => m.record_id)) + 1 : 1;
    const newRecord = {
      record_id: newId,
      patient_id: parseInt(patient_id),
      doctor_id: parseInt(doctor_id),
      diagnosis,
      treatment,
      record_date
    };
    store.medical_records.push(newRecord);
    saveStore(store);
    res.status(201).json({ message: 'Medical record added successfully', record: newRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. REPORTS & ANALYTICS API (JOIN & AGGREGATE)
// ==========================================
app.get('/api/reports/summary', async (req, res) => {
  try {
    if (useDatabase) {
      const [patientsCount] = await pool.query('SELECT COUNT(*) as count FROM Patient');
      const [doctorsCount] = await pool.query('SELECT COUNT(*) as count FROM Doctor');
      const [appointmentsCount] = await pool.query("SELECT COUNT(*) as count FROM Appointment WHERE status='Scheduled'");
      const [billingStats] = await pool.query('SELECT COUNT(*) as bills, COALESCE(SUM(amount),0) as total, COALESCE(AVG(amount),0) as avg FROM Billing');
      const [paidStats] = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM Billing WHERE payment_status='Paid'");

      return res.json({
        totalPatients: patientsCount[0].count,
        totalDoctors: doctorsCount[0].count,
        scheduledAppointments: appointmentsCount[0].count,
        totalBills: billingStats[0].bills,
        totalRevenue: billingStats[0].total,
        paidRevenue: paidStats[0].total,
        databaseConnected: true
      });
    }

    const totalPatients = store.patients.length;
    const totalDoctors = store.doctors.length;
    const scheduledAppointments = store.appointments.filter(a => a.status === 'Scheduled').length;
    const totalBills = store.billing.length;
    const totalRevenue = store.billing.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);
    const paidRevenue = store.billing.filter(b => b.payment_status === 'Paid').reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);

    res.json({
      totalPatients,
      totalDoctors,
      scheduledAppointments,
      totalBills,
      totalRevenue,
      paidRevenue,
      databaseConnected: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/patients-above-40', async (req, res) => {
  try {
    if (useDatabase) {
      const [rows] = await pool.query('SELECT patient_id, patient_name, age, gender, phone, address FROM Patient WHERE age > 40 ORDER BY age DESC');
      return res.json(rows);
    }
    const filtered = store.patients.filter(p => p.age > 40).sort((a, b) => b.age - a.age);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/audits', async (req, res) => {
  try {
    if (useDatabase) {
      const [rows] = await pool.query('SELECT audit_id, appointment_id, message, created_at FROM Appointment_Audit ORDER BY audit_id DESC');
      return res.json(rows);
    }
    res.json(store.appointment_audits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend for all standard routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🏥 Hospital Management System Web Server Running!`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
