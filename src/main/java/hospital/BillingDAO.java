package hospital;

import java.sql.*;
import java.util.Scanner;

public class BillingDAO {
    public static void addBill(Scanner sc) {
        String sql="INSERT INTO Billing(patient_id,amount,payment_status,bill_date) VALUES(?,?,?,NULL)";
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement(sql)){
            System.out.print("Patient ID: "); p.setInt(1,Integer.parseInt(sc.nextLine()));
            System.out.print("Amount: "); p.setDouble(2,Double.parseDouble(sc.nextLine()));
            System.out.print("Payment status: "); p.setString(3,sc.nextLine());
            p.executeUpdate(); System.out.println("Bill created. Trigger set bill date automatically.");
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void viewBills() {
        String sql="SELECT b.bill_id,p.patient_name,b.amount,b.payment_status,b.bill_date FROM Billing b "+
                   "JOIN Patient p ON b.patient_id=p.patient_id ORDER BY b.bill_id";
        try(Connection c=DBConnection.getConnection(); Statement s=c.createStatement(); ResultSet r=s.executeQuery(sql)){
            System.out.printf("%-5s %-20s %-12s %-15s %-12s%n","ID","Patient","Amount","Status","Bill Date");
            while(r.next()) System.out.printf("%-5d %-20s %-12.2f %-15s %-12s%n",
                r.getInt("bill_id"),r.getString("patient_name"),r.getDouble("amount"),
                r.getString("payment_status"),r.getDate("bill_date"));
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }

    public static void updatePaymentStatus(Scanner sc) {
        try(Connection c=DBConnection.getConnection(); PreparedStatement p=c.prepareStatement("UPDATE Billing SET payment_status=? WHERE bill_id=?")){
            System.out.print("Bill ID: "); p.setInt(2,Integer.parseInt(sc.nextLine()));
            System.out.print("New status: "); p.setString(1,sc.nextLine());
            System.out.println(p.executeUpdate()>0?"Payment status updated.":"Bill ID not found.");
        }catch(Exception e){System.out.println("Error: "+e.getMessage());}
    }
}
