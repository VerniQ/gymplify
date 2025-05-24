package me.verni.gymplify.util;

public class PasswordValidator {
    /**
     * Validates if the provided string meets modern password security standards.
     * Requirements:
     * - Minimum length of 12 characters
     * - Contains at least one uppercase letter
     * - Contains at least one lowercase letter
     * - Contains at least one number
     * - Contains at least one special character
     * - No common patterns or dictionary words (simplified check)
     *
     * @param password The password to validate
     * @return ValidationResult with status and message
     */
    public static ValidationResult validatePassword(String password) {
        // Check for null or empty
        if (password == null || password.isEmpty()) {
            return new ValidationResult(false, "Password cannot be empty");
        }

        // Check minimum length (12+ chars recommended in 2025)
        if (password.length() < 12) {
            return new ValidationResult(false, "Password must be at least 12 characters long");
        }

        // Check for uppercase letters
        if (!password.matches(".*[A-Z].*")) {
            return new ValidationResult(false, "Password must contain at least one uppercase letter");
        }

        // Check for lowercase letters
        if (!password.matches(".*[a-z].*")) {
            return new ValidationResult(false, "Password must contain at least one lowercase letter");
        }

        // Check for numbers
        if (!password.matches(".*\\d.*")) {
            return new ValidationResult(false, "Password must contain at least one number");
        }

        // Check for special characters
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            return new ValidationResult(false, "Password must contain at least one special character");
        }

        // Check for common patterns (simple version)
        if (hasCommonPatterns(password)) {
            return new ValidationResult(false, "Password contains common patterns (123, abc, qwerty, etc.)");
        }

        return new ValidationResult(true, "Password meets security requirements");
    }

    /**
     * Check if the password contains common patterns
     */
    private static boolean hasCommonPatterns(String password) {
        String lowerPassword = password.toLowerCase();

        // Common sequences to check for
        String[] commonPatterns = {
                "123456", "password", "qwerty", "abc123", "admin",
                "welcome", "letmein", "monkey", "1234", "12345"
        };

        for (String pattern : commonPatterns) {
            if (lowerPassword.contains(pattern)) {
                return true;
            }
        }

        // Check for repeated characters (e.g., "aaa", "111")
        for (int i = 0; i < password.length() - 2; i++) {
            if (password.charAt(i) == password.charAt(i + 1) &&
                    password.charAt(i) == password.charAt(i + 2)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Simple class to return validation status and message
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String message;

        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
}