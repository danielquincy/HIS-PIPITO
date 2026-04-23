package org.lospipitos.his.iam;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.lospipitos.his.HisProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.lospipitos.his.iam.PantallaService.PantallaAcceso;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
    private final HisProperties hisProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PantallaService pantallaService;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtTokenService jwtTokenService,
            HisProperties hisProperties,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PantallaService pantallaService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
        this.hisProperties = hisProperties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.pantallaService = pantallaService;
    }

    @GetMapping("/me")
    public SessionResponse me(Authentication authentication) {
        AppUser u = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        List<String> roles =
                authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList());
        boolean iamMaster = hisProperties.isIamMaster(roles);
        return new SessionResponse(
                u.getUsername(),
                buildDisplayName(u),
                roles,
                iamMaster,
                u.isPasswordMustChange());
    }

    /** Pantallas del HIS/IAM que el usuario puede usar según los roles asignados en IAM (pantalla ↔ rol). */
    @GetMapping("/mis-pantallas")
    public List<PantallaAcceso> misPantallas(Authentication authentication) {
        AppUser u = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return pantallaService.listAccessibleForUser(u);
    }

    private static String buildDisplayName(AppUser u) {
        StringBuilder sb = new StringBuilder();
        if (u.getPrimerNombre() != null && !u.getPrimerNombre().isBlank()) {
            sb.append(u.getPrimerNombre().trim()).append(' ');
        }
        if (u.getSegundoNombre() != null && !u.getSegundoNombre().isBlank()) {
            sb.append(u.getSegundoNombre().trim()).append(' ');
        }
        if (u.getPrimerApellido() != null && !u.getPrimerApellido().isBlank()) {
            sb.append(u.getPrimerApellido().trim()).append(' ');
        }
        if (u.getSegundoApellido() != null && !u.getSegundoApellido().isBlank()) {
            sb.append(u.getSegundoApellido().trim());
        }
        String s = sb.toString().trim();
        return s.isEmpty() ? u.getUsername() : s;
    }

    public record SessionResponse(
            String username,
            String displayName,
            List<String> roles,
            boolean iamMaster,
            boolean passwordMustChange) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
            AppUser u = userRepository.findByUsername(request.username())
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
            u.setFailedLoginAttempts(0);
            userRepository.save(u);
            Jwt jwt = jwtTokenService.createAccessToken(auth, u);
            Instant issued = jwt.getIssuedAt() != null ? jwt.getIssuedAt() : Instant.now();
            Instant exp = jwt.getExpiresAt() != null ? jwt.getExpiresAt() : issued;
            long expiresIn = Duration.between(issued, exp).getSeconds();
            return ResponseEntity.ok(new TokenResponse(jwt.getTokenValue(), "Bearer", expiresIn));
        } catch (BadCredentialsException e) {
            handleFailedLogin(request.username());
            var opt = userRepository.findByUsername(request.username());
            if (opt.isPresent() && opt.get().getLockedAt() != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorBody("Su usuario se ha bloqueado, por favor contacte con soporte"));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorBody("Credenciales inválidas"));
        } catch (LockedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorBody("Su usuario se ha bloqueado, por favor contacte con soporte"));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorBody("Usuario deshabilitado"));
        }
    }

    private void handleFailedLogin(String username) {
        userRepository.findByUsername(username).ifPresent(u -> {
            if (u.getLockedAt() != null) {
                return;
            }
            u.setFailedLoginAttempts(u.getFailedLoginAttempts() + 1);
            if (u.getFailedLoginAttempts() >= 3) {
                u.setLockedAt(Instant.now());
            }
            userRepository.save(u);
        });
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        AppUser u = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (!passwordEncoder.matches(request.currentPassword(), u.getPasswordHash())) {
            throw new IllegalArgumentException("Contraseña actual incorrecta");
        }
        u.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        u.setPasswordMustChange(false);
        u.setTemporalPassword(false);
        userRepository.save(u);
        return ResponseEntity.noContent().build();
    }

    public record ErrorBody(String message) {}

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record TokenResponse(String accessToken, String tokenType, long expiresIn) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 6, max = 128) String newPassword) {}
}
