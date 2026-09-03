package lk.menara.globaltrade.auth.util;

public class Validation {
    private static final String emailRegex = "^[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,6}$";
    private static final String contactRegex = "^07[01245678]\\d{7}$";
    private static final String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=]).{8,}$";

    public static boolean isValidEmail(String email) {
        if (email == null) {
            return false;
        }
        return email.matches(emailRegex);
    }

    public static boolean isValidContact(String contact) {
        if (contact == null) {
            return false;
        }
        return contact.matches(contactRegex);
    }

    public static boolean isValidPassword(String password) {
        if (password == null) {
            return false;
        }
        return password.matches(passwordRegex);
    }
}