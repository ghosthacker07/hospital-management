package hospital;

import java.sql.*;
import java.util.Scanner;

public class DoctorDAO {
    public static void addDoctor(Scanner sc) {
        String sql="INSERT INTO Doctor(doctor_name,specialization,phone) VALUES(?,?,?)";
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement(sql)){
            System.out.print("Doctor name: "); p.setString(1,sc.nextLine());
            System.out.print("Specialization: "); p.setString(2,sc.nextLine());
            System.out.print("Phone: "); p.setString(3,sc.nextLine());
            p.executeUpdate(); System.out.println("Doctor added successfully.");
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void viewDoctors() {
        try(Connection c=DBConnection.getConnection(); Statement s=c.createStatement();
            ResultSet r=s.executeQuery("SELECT * FROM Doctor ORDER BY doctor_id")){
            System.out.printf("%-5s %-22s %-20s %-15s%n","ID","Doctor","Specialization","Phone");
            while(r.next()) System.out.printf("%-5d %-22s %-20s %-15s%n",
                r.getInt("doctor_id"),r.getString("doctor_name"),r.getString("specialization"),r.getString("phone"));
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void updateDoctor(Scanner sc) {
        String sql="UPDATE Doctor SET doctor_name=?,specialization=?,phone=? WHERE doctor_id=?";
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement(sql)){
            System.out.print("Doctor ID: "); int id=Integer.parseInt(sc.nextLine());
            System.out.print("New name: "); p.setString(1,sc.nextLine());
            System.out.print("New specialization: "); p.setString(2,sc.nextLine());
            System.out.print("New phone: "); p.setString(3,sc.nextLine()); p.setInt(4,id);
            System.out.println(p.executeUpdate()>0?"Doctor updated successfully.":"Doctor ID not found.");
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void deleteDoctor(Scanner sc) {
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement("DELETE FROM Doctor WHERE doctor_id=?")){
            System.out.print("Doctor ID: "); p.setInt(1,Integer.parseInt(sc.nextLine()));
            System.out.println(p.executeUpdate()>0?"Doctor deleted successfully.":"Doctor ID not found.");
        }catch(Exception e){System.out.println("Cannot delete: doctor may have related records.");}
    }
}
