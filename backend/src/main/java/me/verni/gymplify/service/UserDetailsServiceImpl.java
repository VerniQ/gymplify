package me.verni.gymplify.service;

import me.verni.gymplify.dto.User; // Twoje DTO użytkownika
import me.verni.gymplify.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        Optional<User> userOptional = userRepository.findUserDetailsByEmail(email);

        if (userOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }

        User appUser = userOptional.get();

        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + appUser.getRole().name());

        return new org.springframework.security.core.userdetails.User(
                appUser.getEmail(),
                appUser.getPasswordHash(), // Hash hasła z bazy
                Collections.singletonList(authority)
        );
    }
}