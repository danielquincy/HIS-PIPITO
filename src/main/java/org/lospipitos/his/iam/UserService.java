package org.lospipitos.his.iam;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final String PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream().map(UserResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listBlockedUsers() {
        return userRepository.findByLockedAtIsNotNullOrderByLockedAtDesc().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public CreateUserResult createUser(
            String username,
            String passwordPlain,
            boolean generateRandom,
            boolean temporal,
            String email,
            String primerNombre,
            String segundoNombre,
            String primerApellido,
            String segundoApellido,
            LocalDate cuentaExpiraEn,
            Set<String> roleNames) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("El usuario ya existe");
        }
        String raw;
        if (generateRandom) {
            raw = randomPassword(12);
        } else {
            if (passwordPlain == null || passwordPlain.isBlank()) {
                throw new IllegalArgumentException("Indique contraseña o marque generar aleatoria");
            }
            raw = passwordPlain;
        }
        AppUser u = new AppUser();
        u.setUsername(username.trim());
        u.setEmail(email != null ? email.trim() : null);
        u.setPrimerNombre(trimOrNull(primerNombre));
        u.setSegundoNombre(trimOrNull(segundoNombre));
        u.setPrimerApellido(trimOrNull(primerApellido));
        u.setSegundoApellido(trimOrNull(segundoApellido));
        u.setCuentaExpiraEn(cuentaExpiraEn);
        u.setPasswordHash(passwordEncoder.encode(raw));
        u.setEnabled(true);
        u.setPasswordMustChange(temporal);
        u.setTemporalPassword(temporal);
        for (String rn : roleNames) {
            Role r = roleRepository.findByName(rn)
                    .orElseThrow(() -> new IllegalArgumentException("Rol desconocido: " + rn));
            u.getRoles().add(r);
        }
        AppUser saved = userRepository.save(u);
        String generated = generateRandom ? raw : null;
        return new CreateUserResult(UserResponse.from(saved), generated);
    }

    @Transactional
    public UserResponse replaceRoles(Long userId, Set<String> roleNames) {
        AppUser u = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        u.getRoles().clear();
        for (String rn : roleNames) {
            Role r = roleRepository.findByName(rn)
                    .orElseThrow(() -> new IllegalArgumentException("Rol desconocido: " + rn));
            u.getRoles().add(r);
        }
        return UserResponse.from(userRepository.save(u));
    }

    @Transactional
    public UserResponse updateUserProfile(
            Long userId,
            String email,
            String primerNombre,
            String segundoNombre,
            String primerApellido,
            String segundoApellido,
            LocalDate cuentaExpiraEn,
            boolean enabled) {
        AppUser u = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        u.setEmail(email != null ? email.trim() : null);
        u.setPrimerNombre(trimOrNull(primerNombre));
        u.setSegundoNombre(trimOrNull(segundoNombre));
        u.setPrimerApellido(trimOrNull(primerApellido));
        u.setSegundoApellido(trimOrNull(segundoApellido));
        u.setCuentaExpiraEn(cuentaExpiraEn);
        u.setEnabled(enabled);
        return UserResponse.from(userRepository.save(u));
    }

    @Transactional
    public UserResponse unlockUser(Long userId, String newPassword, boolean temporalPassword) {
        AppUser u = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (newPassword != null && !newPassword.isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
            u.setTemporalPassword(temporalPassword);
            u.setPasswordMustChange(temporalPassword);
        }
        u.setLockedAt(null);
        u.setFailedLoginAttempts(0);
        return UserResponse.from(userRepository.save(u));
    }

    private static String trimOrNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private String randomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PASSWORD_CHARS.charAt(secureRandom.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    public record UserResponse(
            Long id,
            String username,
            String email,
            boolean enabled,
            Set<String> roles,
            Integer failedLoginAttempts,
            Instant lockedAt,
            boolean passwordMustChange,
            boolean temporalPassword,
            String primerNombre,
            String segundoNombre,
            String primerApellido,
            String segundoApellido,
            LocalDate cuentaExpiraEn) {
        static UserResponse from(AppUser u) {
            return new UserResponse(
                    u.getId(),
                    u.getUsername(),
                    u.getEmail(),
                    u.isEnabled(),
                    u.getRoles().stream().map(Role::getName).collect(Collectors.toSet()),
                    u.getFailedLoginAttempts(),
                    u.getLockedAt(),
                    u.isPasswordMustChange(),
                    u.isTemporalPassword(),
                    u.getPrimerNombre(),
                    u.getSegundoNombre(),
                    u.getPrimerApellido(),
                    u.getSegundoApellido(),
                    u.getCuentaExpiraEn());
        }
    }

    public record CreateUserResult(UserResponse user, String generatedPassword) {}
}
