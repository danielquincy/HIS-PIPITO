package org.lospipitos.his.iam;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashSet;

@RestController
@RequestMapping("/api/iam/users")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_IAM_MASTER')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public java.util.List<UserService.UserResponse> list() {
        return userService.listUsers();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateUserResponse create(@Valid @RequestBody CreateUserRequest body) {
        boolean gen = Boolean.TRUE.equals(body.generateRandomPassword());
        boolean temporal = Boolean.TRUE.equals(body.temporalPassword());
        UserService.CreateUserResult result = userService.createUser(
                body.username(),
                body.password(),
                gen,
                temporal,
                body.email(),
                body.primerNombre(),
                body.segundoNombre(),
                body.primerApellido(),
                body.segundoApellido(),
                body.cuentaExpiraEn(),
                new HashSet<>(body.roles() == null ? java.util.List.of() : body.roles()));
        return new CreateUserResponse(result.user(), result.generatedPassword());
    }

    @PutMapping("/{id}")
    public UserService.UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest body) {
        return userService.updateUserProfile(
                id,
                body.email(),
                body.primerNombre(),
                body.segundoNombre(),
                body.primerApellido(),
                body.segundoApellido(),
                body.cuentaExpiraEn(),
                body.enabled());
    }

    @PutMapping("/{id}/roles")
    public UserService.UserResponse updateRoles(@PathVariable Long id, @Valid @RequestBody RolesRequest body) {
        return userService.replaceRoles(id, new HashSet<>(body.roles()));
    }

    public record CreateUserRequest(
            @NotBlank String username,
            String password,
            Boolean temporalPassword,
            Boolean generateRandomPassword,
            String email,
            String primerNombre,
            String segundoNombre,
            String primerApellido,
            String segundoApellido,
            LocalDate cuentaExpiraEn,
            java.util.List<String> roles) {}

    public record CreateUserResponse(UserService.UserResponse user, String generatedPassword) {}

    public record UpdateUserRequest(
            String email,
            String primerNombre,
            String segundoNombre,
            String primerApellido,
            String segundoApellido,
            LocalDate cuentaExpiraEn,
            @NotNull Boolean enabled) {}

    public record RolesRequest(@NotEmpty java.util.List<String> roles) {}
}
