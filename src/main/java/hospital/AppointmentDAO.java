package hospital;

import java.sql.*;
import java.util.Scanner;

public class AppointmentDAO {
    public static void addAppointment(Scanner sc) {
        String sql="INSERT INTO Appointment(patient_id,doctor_id,appointment_date,appointment_time,status) VALUES(?,?,?,?,?)";
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement(sql)){
            System.out.print("Patient ID: "); p.setInt(1,Integer.parseInt(sc.nextLine()));
            System.out.print("Doctor ID: "); p.setInt(2,Integer.parseInt(sc.nextLine()));
            System.out.print("Date (YYYY-MM-DD): "); p.setDate(3,Date.valueOf(sc.nextLine()));
            System.out.print("Time (HH:MM:SS): "); p.setTime(4,Time.valueOf(sc.nextLine()));
            System.out.print("Status: "); p.setString(5,sc.nextLine());
            p.executeUpdate(); System.out.println("Appointment added. Trigger audit created.");
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void viewAppointments() {
        String sql="SELECT a.appointment_id,p.patient_name,d.doctor_name,d.specialization,a.appointment_date,a.appointment_time,a.status "+
                   "FROM Appointment a JOIN Patient p ON a.patient_id=p.patient_id JOIN Doctor d ON a.doctor_id=d.doctor_id "+
                   "ORDER BY a.appointment_date,a.appointment_time";
        try(Connection c=DBConnection.getConnection(); Statement s=c.createStatement(); ResultSet r=s.executeQuery(sql)){
            System.out.printf("%-5s %-18s %-20s %-18s %-12s %-10s %-12s%n","ID","Patient","Doctor","Specialization","Date","Time","Status");
            while(r.next()) System.out.printf("%-5d %-18s %-20s %-18s %-12s %-10s %-12s%n",
                r.getInt("appointment_id"),r.getString("patient_name"),r.getString("doctor_name"),
                r.getString("specialization"),r.getDate("appointment_date"),r.getTime("appointment_time"),r.getString("status"));
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void updateStatus(Scanner sc) {
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement("UPDATE Appointment SET status=? WHERE appointment_id=?")){
            System.out.print("Appointment ID: "); p.setInt(2,Integer.parseInt(sc.nextLine()));
            System.out.print("New status: "); p.setString(1,sc.nextLine());
            System.out.println(p.executeUpdate()>0?"Appointment updated.":"Appointment ID not found.");
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }
}
