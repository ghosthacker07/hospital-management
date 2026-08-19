package hospital;

import java.sql.Connection;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        try(Connection c=DBConnection.getConnection()){
            System.out.println("\n======================================");
            System.out.println("       HOSPITAL MANAGEMENT SYSTEM");
            System.out.println("======================================");
            System.out.println("Database connection successful.");
        }catch(Exception e){
            System.out.println("Database connection failed.");
            System.out.println("Start MySQL and check DBConnection.java password.");
            System.out.println("Details: "+e.getMessage());
            return;
        }

        Scanner sc=new Scanner(System.in);
        while(true){
            System.out.println("\n========== MAIN MENU ==========");
            System.out.println("1. Patient Management");
            System.out.println("2. Doctor Management");
            System.out.println("3. Appointment Management");
            System.out.println("4. Billing Management");
            System.out.println("5. Medical Record Management");
            System.out.println("6. Reports / JOIN Queries");
            System.out.println("7. Exit");
            System.out.print("Enter choice: ");
            switch(sc.nextLine()){
                case "1" -> patientMenu(sc);
                case "2" -> doctorMenu(sc);
                case "3" -> appointmentMenu(sc);
                case "4" -> billingMenu(sc);
                case "5" -> recordMenu(sc);
                case "6" -> reportMenu(sc);
                case "7" -> { System.out.println("Thank you!"); return; }
                default -> System.out.println("Invalid choice.");
            }
        }
    }

    static void patientMenu(Scanner sc){
        while(true){
            System.out.println("\n--- PATIENT MANAGEMENT ---");
            System.out.println("1.Add  2.View  3.Update  4.Delete  5.Back");
            System.out.print("Choice: ");
            switch(sc.nextLine()){
                case "1"->PatientDAO.addPatient(sc);
                case "2"->PatientDAO.viewPatients();
                case "3"->PatientDAO.updatePatient(sc);
                case "4"->PatientDAO.deletePatient(sc);
                case "5"->{return;}
                default->System.out.println("Invalid choice.");
            }
        }
    }

    static void doctorMenu(Scanner sc){
        while(true){
            System.out.println("\n--- DOCTOR MANAGEMENT ---");
            System.out.println("1.Add  2.View  3.Update  4.Delete  5.Back");
            System.out.print("Choice: ");
            switch(sc.nextLine()){
                case "1"->DoctorDAO.addDoctor(sc);
                case "2"->DoctorDAO.viewDoctors();
                case "3"->DoctorDAO.updateDoctor(sc);
                case "4"->DoctorDAO.deleteDoctor(sc);
                case "5"->{return;}
                default->System.out.println("Invalid choice.");
            }
        }
    }

    static void appointmentMenu(Scanner sc){
        while(true){
            System.out.println("\n--- APPOINTMENT MANAGEMENT ---");
            System.out.println("1.Add  2.View/JOIN  3.Update Status  4.Back");
            System.out.print("Choice: ");
            switch(sc.nextLine()){
                case "1"->AppointmentDAO.addAppointment(sc);
                case "2"->AppointmentDAO.viewAppointments();
                case "3"->AppointmentDAO.updateStatus(sc);
                case "4"->{return;}
                default->System.out.println("Invalid choice.");
            }
        }
    }

    static void billingMenu(Scanner sc){
        while(true){
            System.out.println("\n--- BILLING MANAGEMENT ---");
            System.out.println("1.Create Bill  2.View/JOIN  3.Update Payment  4.Back");
            System.out.print("Choice: ");
            switch(sc.nextLine()){
                case "1"->BillingDAO.addBill(sc);
                case "2"->BillingDAO.viewBills();
                case "3"->BillingDAO.updatePaymentStatus(sc);
                case "4"->{return;}
                default->System.out.println("Invalid choice.");
            }
        }
    }

    static void recordMenu(Scanner sc){
        while(true){
            System.out.println("\n--- MEDICAL RECORD MANAGEMENT ---");
            System.out.println("1.Add Record  2.View/JOIN  3.Back");
            System.out.print("Choice: ");
            switch(sc.nextLine()){
                case "1"->MedicalRecordDAO.addRecord(sc);
                case "2"->MedicalRecordDAO.viewRecords();
                case "3"->{return;}
                default->System.out.println("Invalid choice.");
            }
        }
    }

    static void reportMenu(Scanner sc){
        while(true){
            System.out.println("\n--- REPORTS ---");
            System.out.println("1.Appointment JOIN  2.Billing Summary  3.Patients Above 40  4.Trigger Audit  5.Back");
            System.out.print("Choice: ");
            switch(sc.nextLine()){
                case "1"->ReportDAO.appointmentJoinReport();
                case "2"->ReportDAO.billingSummary();
                case "3"->ReportDAO.patientsAbove40();
                case "4"->ReportDAO.auditReport();
                case "5"->{return;}
                default->System.out.println("Invalid choice.");
            }
        }
    }
}
