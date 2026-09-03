package lk.menara.globaltrade.scm.bean.service;

import jakarta.ejb.Asynchronous;
import jakarta.ejb.Stateless;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Stateless
public class ProcurementService {

    // කෝඩිනේටර් RFQ Sourcing පටන් ගත් විට ක්‍රියාත්මක වන මෙතඩ් එක
    public void sourceRfq(Long productId, Long warehouseId, int customQty, String customExpectedDate) {

        // 1. Quantity Logic: කෝඩිනේටර් වෙනස් කළේ නැත්නම් ඩිෆෝල්ට් 20ක් හෝ වෙනත් ලොජික් එකක් පාවිච්චි කරන්න
        int finalQty = (customQty > 0) ? customQty : 20;

        // 2. Expected Date Logic: දවස් 7කින් ලැබෙන ලෙස ඔටෝ සැකසීම (කෝඩිනේටර් වෙනස් කර නොමැති නම්)
        String finalExpectedDate;
        if (customExpectedDate == null || customExpectedDate.isEmpty()) {
            LocalDate targetDate = LocalDate.now().plusDays(7);
            finalExpectedDate = targetDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        } else {
            finalExpectedDate = customExpectedDate;
        }

        // 3. ඩේටාබේස් එකේ RFQ එක Save කිරීමේ කේතය මෙහි ලියන්න...
        // saveRfqToDatabase(productId, warehouseId, finalQty, finalExpectedDate);

        // 4. සියල්ල සාර්ථක වූ පසු, වෙන්ඩර් වෙත අසමීකෘත (Asynchronous) ඊමේල් එක යැවීම
        sendEmailToVendorAsync(productId, finalQty, finalExpectedDate);
    }

    @Asynchronous
    public void sendEmailToVendorAsync(Long productId, int quantity, String expectedDate) {
        System.out.println("[ASYNC VENDOR MAILER] Dispatching email to vendor...");

        // මෙහි ඔබ ළඟ ඇති JavaMail කේතය පාවිච්චි කර වෙන්ඩර්ට ඊමේල් යවන්න.
        // ඊමේල් එක ඇතුළේ Quantity එක සහ Expected Date එක පෙන්වන්න පුළුවන්.
        String subject = "New RFQ Sourced - Action Required";
        String body = "A new RFQ has been generated. Quantity: " + quantity + ", Expected Delivery Date: " + expectedDate;

        // Transport.send(message); කලින් හැදූ NotificationService එක මෙහිදී කෝල් කළ හැක.
    }
}