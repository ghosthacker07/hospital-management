CREATE DATABASE IF NOT EXISTS HospitalDB;
USE HospitalDB;

CREATE TABLE IF NOT EXISTS Patient (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    age INT,
    phone VARCHAR(15),
    address VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS Doctor (
    doctor_id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS Appointment (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled',
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id)
);

CREATE TABLE IF NOT EXISTS Billing (
    bill_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'Pending',
    bill_date DATE,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
);

CREATE TABLE IF NOT EXISTS Medical_Record (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    diagnosis VARCHAR(200),
    treatment VARCHAR(200),
    record_date DATE,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id)
);

CREATE TABLE IF NOT EXISTS Appointment_Audit (
    audit_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT,
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS bill_date_trigger;
DROP TRIGGER IF EXISTS appointment_audit_trigger;

DELIMITER //

CREATE TRIGGER bill_date_trigger
BEFORE INSERT ON Billing
FOR EACH ROW
BEGIN
    IF NEW.bill_date IS NULL THEN
        SET NEW.bill_date = CURDATE();
    END IF;
END //

CREATE TRIGGER appointment_audit_trigger
AFTER INSERT ON Appointment
FOR EACH ROW
BEGIN
    INSERT INTO Appointment_Audit(appointment_id, message)
    VALUES (NEW.appointment_id, 'New appointment created');
END //

DELIMITER ;

INSERT INTO Patient (patient_name, gender, age, phone, address)
SELECT 'Rohan Kumar','Male',25,'9876543210','Lucknow'
WHERE NOT EXISTS (SELECT 1 FROM Patient WHERE phone='9876543210');

INSERT INTO Patient (patient_name, gender, age, phone, address)
SELECT 'Priya Singh','Female',30,'9876543211','Kanpur'
WHERE NOT EXISTS (SELECT 1 FROM Patient WHERE phone='9876543211');

INSERT INTO Patient (patient_name, gender, age, phone, address)
SELECT 'Amit Verma','Male',45,'9876543212','Azamgarh'
WHERE NOT EXISTS (SELECT 1 FROM Patient WHERE phone='9876543212');

INSERT INTO Patient (patient_name, gender, age, phone, address)
SELECT 'Neha Sharma','Female',28,'9876543213','Delhi'
WHERE NOT EXISTS (SELECT 1 FROM Patient WHERE phone='9876543213');

INSERT INTO Doctor (doctor_name, specialization, phone)
SELECT 'Dr. Raj Sharma','Cardiologist','9123456780'
WHERE NOT EXISTS (SELECT 1 FROM Doctor WHERE phone='9123456780');

INSERT INTO Doctor (doctor_name, specialization, phone)
SELECT 'Dr. Priya Verma','Dermatologist','9123456781'
WHERE NOT EXISTS (SELECT 1 FROM Doctor WHERE phone='9123456781');

INSERT INTO Doctor (doctor_name, specialization, phone)
SELECT 'Dr. Amit Singh','Orthopedic','9123456782'
WHERE NOT EXISTS (SELECT 1 FROM Doctor WHERE phone='9123456782');
