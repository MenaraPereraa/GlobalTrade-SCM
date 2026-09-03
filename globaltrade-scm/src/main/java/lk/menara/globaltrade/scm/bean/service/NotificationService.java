package lk.menara.globaltrade.scm.bean.service;

import jakarta.ejb.Asynchronous;
import jakarta.ejb.Stateless;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lk.menara.globaltrade.core.entity.Product;
import lk.menara.globaltrade.core.entity.Warehouse;

import java.util.Properties;

@Stateless
public class NotificationService {

    private static final String SMTP_HOST = "smtp.gmail.com";
    private static final String SMTP_PORT = "587";
    private static final String SENDER_EMAIL = "menaraperera1123@gmail.com";
    private static final String SENDER_PASSWORD = "jxqh quxt dmvp imye";
    private static final String PROCUREMENT_EMAIL = "menaraperera1123@gmail.com";

    private Properties getSmtpProperties() {
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", SMTP_HOST);
        props.put("mail.smtp.port", SMTP_PORT);
        props.put("mail.smtp.ssl.trust", SMTP_HOST);
        props.put("mail.smtp.ssl.checkserveridentity", "false");
        return props;
    }

    @Asynchronous
    public void sendLowStockAlert(Warehouse warehouse, Product product, int currentQty, int threshold) {
        System.out.println("[ASYNC MAILER] Starting background thread for Low Stock Alert...");

        Session session = Session.getInstance(getSmtpProperties(), new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SENDER_EMAIL, SENDER_PASSWORD);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SENDER_EMAIL, "GlobalTrade SCM Alert"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(PROCUREMENT_EMAIL));
            message.setSubject("CRITICAL: Low Stock Alert - " + warehouse.getName());

            String htmlBody = String.format(
                    "<div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 600px;'>" +
                            "<h2 style='color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 10px;'>Low Stock Warning</h2>" +
                            "<p style='color: #475569;'>The following product has dropped below the reorder threshold. Please generate a Purchase Requisition (PR) or Request For Quotation (RFQ) immediately.</p>" +
                            "<table style='width: 100%%; border-collapse: collapse; margin-top: 20px;'>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>Warehouse:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;'>%s</td></tr>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>SKU:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;'>%s</td></tr>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>Product Name:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>%s</td></tr>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>Current Stock:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: bold; font-size: 18px;'>%d Units</td></tr>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>Threshold:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>%d Units</td></tr>" +
                            "</table>" +
                            "<p style='margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;'>This is an automated message from GlobalTrade Enterprise SCM.</p>" +
                            "</div>",
                    warehouse.getName(), product.getSku(), product.getName(), currentQty, threshold
            );

            message.setContent(htmlBody, "text/html; charset=utf-8");
            Transport.send(message);

            System.out.println("[ASYNC MAILER] Email successfully dispatched to Procurement!");

        } catch (Exception e) {
            System.err.println("[ASYNC MAILER] Failed to send email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Asynchronous
    public void sendReminderEmail(Warehouse warehouse, Product product, int currentQty, int threshold) {
        Session session = Session.getInstance(getSmtpProperties(), new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SENDER_EMAIL, SENDER_PASSWORD);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SENDER_EMAIL, "GlobalTrade SCM Reminder"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(PROCUREMENT_EMAIL));
            message.setSubject("REMINDER: Replenishment Required - " + warehouse.getName());

            String htmlBody = String.format(
                    "<div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 600px;'>" +
                            "<h2 style='color: #d97706; border-bottom: 2px solid #fef3c7; padding-bottom: 10px;'>Stock Replenishment Reminder</h2>" +
                            "<p style='color: #475569;'>This is a reminder triggered by the Coordinator that the following product is still running low on stock and requires urgent attention.</p>" +
                            "<table style='width: 100%%; border-collapse: collapse; margin-top: 20px;'>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>Warehouse:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;'>%s</td></tr>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>SKU:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;'>%s</td></tr>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>Product Name:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>%s</td></tr>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>Current Stock:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: bold; font-size: 18px;'>%d Units</td></tr>" +
                            "<tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;'><b>Threshold:</b></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>%d Units</td></tr>" +
                            "</table>" +
                            "<p style='margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;'>Reminder triggered via GlobalTrade SCM Coordinator Portal.</p>" +
                            "</div>",
                    warehouse.getName(), product.getSku(), product.getName(), currentQty, threshold
            );

            message.setContent(htmlBody, "text/html; charset=utf-8");
            Transport.send(message);
        } catch (Exception e) {
            System.err.println("[ASYNC MAILER] Failed to send reminder email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Asynchronous
    public void sendEmail(String recipientEmail, String subject, String htmlBody) {
        Session session = Session.getInstance(getSmtpProperties(), new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SENDER_EMAIL, SENDER_PASSWORD);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SENDER_EMAIL, "GlobalTrade SCM Portal"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipientEmail));
            message.setSubject(subject);
            message.setContent(htmlBody, "text/html; charset=utf-8");
            Transport.send(message);
            System.out.println("[MAILER] Email successfully sent to: " + recipientEmail);
        } catch (Exception e) {
            System.err.println("[MAILER ERROR] Failed to send email to " + recipientEmail + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}