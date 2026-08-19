package hospital;

import java.sql.*;
import java.util.Scanner;

public class PatientDAO {
    public static void addPatient(Scanner sc) {
        String sql="INSERT INTO Patient(patient_name,gender,age,phone,address) VALUES(?,?,?,?,?)";
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement(sql)){
            System.out.print("Name: "); String n=sc.nextLine();
            System.out.print("Gender: "); String g=sc.nextLine();
            System.out.print("Age: "); int a=Integer.parseInt(sc.nextLine());
            System.out.print("Phone: "); String ph=sc.nextLine();
            System.out.print("Address: "); String ad=sc.nextLine();
            p.setString(1,n); p.setString(2,g); p.setInt(3,a); p.setString(4,ph); p.setString(5,ad);
            p.executeUpdate(); System.out.println("Patient added successfully.");
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void viewPatients() {
        String sql="SELECT * FROM Patient ORDER BY patient_id";
        try(Connection c=DBConnection.getConnection(); Statement s=c.createStatement(); ResultSet r=s.executeQuery(sql)){
            System.out.printf("%-5s %-20s %-10s %-5s %-15s %-20s%n","ID","Name","Gender","Age","Phone","Address");
            while(r.next()) System.out.printf("%-5d %-20s %-10s %-5d %-15s %-20s%n",
                r.getInt("patient_id"),r.getString("patient_name"),r.getString("gender"),
                r.getInt("age"),r.getString("phone"),r.getString("address"));
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void updatePatient(Scanner sc) {
        String sql="UPDATE Patient SET patient_name=?,gender=?,age=?,phone=?,address=? WHERE patient_id=?";
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement(sql)){
            System.out.print("Patient ID: "); int id=Integer.parseInt(sc.nextLine());
            System.out.print("New name: "); p.setString(1,sc.nextLine());
            System.out.print("New gender: "); p.setString(2,sc.nextLine());
            System.out.print("New age: "); p.setInt(3,Integer.parseInt(sc.nextLine()));
            System.out.print("New phone: "); p.setString(4,sc.nextLine());
            System.out.print("New address: "); p.setString(5,sc.nextLine());
            p.setInt(6,id);
            System.out.println(p.executeUpdate()>0?"Patient updated successfully.":"Patient ID not found.");
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void deletePatient(Scanner sc) {
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement("DELETE FROM Patient WHERE patient_id=?")){
            System.out.print("Patient ID: "); p.setInt(1,Integer.parseInt(sc.nextLine()));
            System.out.println(p.executeUpdate()>0?"Patient deleted successfully.":"Patient ID not found.");
        }catch(Exception e){System.out.println("Cannot delete: patient may have related records.");}
    }
}
