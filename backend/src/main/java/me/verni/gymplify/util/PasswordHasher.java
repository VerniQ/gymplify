package me.verni.gymplify.util;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordHasher {

    private static final int WORKLOAD = 12;

    public static String hash(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt(WORKLOAD));
    }

    public static boolean matches(String rawPassword, String hashedPassword) {
        return BCrypt.checkpw(rawPassword, hashedPassword);
    }
}
