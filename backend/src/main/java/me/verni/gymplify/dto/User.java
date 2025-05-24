package me.verni.gymplify.dto;

import me.verni.gymplify.util.RoleType;

public class User {
    Long userId;
    String username;
    String passwordHash;
    String email;
    RoleType role;


    public User(Long user_id, String username, String password_hash, String email, RoleType role) {
        this.userId = user_id;
        this.username = username;
        this.passwordHash = password_hash;
        this.email = email;
        this.role = role;
    }

    public User(String username, String password_hash, String email, RoleType role) {
        this.username = username;
        this.passwordHash = password_hash;
        this.email = email;
        this.role = role;
    }
    public User(){

    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public RoleType getRole() {
        return role;
    }

    public void setRole(RoleType role) {
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}
