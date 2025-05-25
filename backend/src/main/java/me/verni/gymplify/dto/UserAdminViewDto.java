package me.verni.gymplify.dto;

import me.verni.gymplify.util.RoleType;

public class UserAdminViewDto {
    private Long userId;
    private String username;
    private String email;
    private RoleType role;

    public UserAdminViewDto(Long userId, String username, String email, RoleType role) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
    }

    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public RoleType getRole() { return role; }
}