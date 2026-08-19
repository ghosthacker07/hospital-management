# Hospital Management System - Java + MySQL

## Requirements
- JDK 17+
- VS Code + Extension Pack for Java
- MySQL Server / MySQL Workbench
- Maven

## Setup
1. Open MySQL Workbench and run `schema.sql`.
2. Open `src/main/java/hospital/DBConnection.java`.
3. Replace `YOUR_MYSQL_PASSWORD` with your MySQL root password.
4. Open this folder in VS Code.
5. In Terminal run:
   `mvn clean compile`
   `mvn exec:java`

## Features
- Patient CRUD
- Doctor CRUD
- Appointment management
- Billing management
- Medical records
- JOIN reports
- Two MySQL triggers
- JDBC database connectivity
- Menu-driven console application

## DBMS requirements
CRUD: INSERT, SELECT, UPDATE, DELETE
JOIN: Patient + Doctor + Appointment; Patient + Billing; Medical Record + Patient + Doctor
TRIGGER: automatic bill date and appointment audit
