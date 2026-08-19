package hospital;

import java.sql.*;

public class ReportDAO {
    public static void appointmentJoinReport() {
        String sql="SELECT p.patient_name,d.doctor_name,d.specialization,a.appointment_date,a.appointment_time,a.status "+
                   "FROM Appointment a JOIN Patient p ON a.patient_id=p.patient_id "+
                   "JOIN Doctor d ON a.doctor_id=d.doctor_id ORDER BY a.appointment_date";
        try(Connection c=DBConnection.getConnection(); Statement s=c.createStatement(); ResultSet r=s.executeQuery(sql)){
            System.out.println("\n--- PATIENT + DOCTOR + APPOINTMENT JOIN ---");
            while(r.next()) System.out.printf("Patient: %s | Doctor: %s | Specialization: %s | Date: %s | Time: %s | Status: %s%n",
                r.getString("patient_name"),r.getString("doctor_name"),r.getString("specialization"),
                r.getDate("appointment_date"),r.getTime("appointment_time"),r.getString("status"));
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void billingSummary() {
        try(Connection c=DBConnection.getConnection(); Statement s=c.createStatement();
            ResultSet r=s.executeQuery("SELECT COUNT(*) bills,COALESCE(SUM(amount),0) total FROM Billing")){
            if(r.next()){System.out.println("Total bills: "+r.getInt("bills")); System.out.printf("Total amount: %.2f%n",r.getDouble("total"));}
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void patientsAbove40() {
        try(Connection c=DBConnection.getConnection(); Statement s=c.createStatement();
            ResultSet r=s.executeQuery("SELECT patient_name,age,gender FROM Patient WHERE age>40 ORDER BY age DESC")){
            System.out.println("\n--- PATIENTS ABOVE 40 ---");
            while(r.next()) System.out.printf("%s | Age: %d | Gender: %s%n",r.getString("patient_name"),r.getInt("age"),r.getString("gender"));
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void auditReport() {
        try(Connection c=DBConnection.getConnection(); Statement s=c.createStatement();
            ResultSet r=s.executeQuery("SELECT * FROM Appointment_Audit ORDER BY audit_id DESC")){
            System.out.println("\n--- TRIGGER AUDIT REPORT ---");
            while(r.next()) System.out.printf("Audit ID: %d | Appointment ID: %d | %s | %s%n",
                r.getInt("audit_id"),r.getInt("appointment_id"),r.getString("message"),r.getTimestamp("created_at"));
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }
}
