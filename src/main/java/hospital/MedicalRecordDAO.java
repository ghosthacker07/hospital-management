package hospital;

import java.sql.*;
import java.util.Scanner;

public class MedicalRecordDAO {
    public static void addRecord(Scanner sc) {
        String sql="INSERT INTO Medical_Record(patient_id,doctor_id,diagnosis,treatment,record_date) VALUES(?,?,?,?,?)";
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement(sql)){
            System.out.print("Patient ID: "); p.setInt(1,Integer.parseInt(sc.nextLine()));
            System.out.print("Doctor ID: "); p.setInt(2,Integer.parseInt(sc.nextLine()));
            System.out.print("Diagnosis: "); p.setString(3,sc.nextLine());
            System.out.print("Treatment: "); p.setString(4,sc.nextLine());
            System.out.print("Date (YYYY-MM-DD): "); p.setDate(5,Date.valueOf(sc.nextLine()));
            p.executeUpdate(); System.out.println("Medical record added.");
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void viewRecords() {
        String sql="SELECT m.record_id,p.patient_name,d.doctor_name,m.diagnosis,m.treatment,m.record_date "+
                   "FROM Medical_Record m JOIN Patient p ON m.patient_id=p.patient_id "+
                   "JOIN Doctor d ON m.doctor_id=d.doctor_id ORDER BY m.record_id";
        try(Connection c=DBConnection.getConnection(); Statement s=c.createStatement(); ResultSet r=s.executeQuery(sql)){
            System.out.printf("%-5s %-18s %-20s %-20s %-25s %-12s%n","ID","Patient","Doctor","Diagnosis","Treatment","Date");
            while(r.next()) System.out.printf("%-5d %-18s %-20s %-20s %-25s %-12s%n",
                r.getInt("record_id"),r.getString("patient_name"),r.getString("doctor_name"),
                r.getString("diagnosis"),r.getString("treatment"),r.getDate("record_date"));
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }
}
