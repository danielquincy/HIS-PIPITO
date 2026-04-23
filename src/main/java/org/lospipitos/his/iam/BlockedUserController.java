package org.lospipitos.his.iam;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/iam/blocked-users")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_IAM_MASTER')")
public class BlockedUserController {

    private final UserService userService;

    public BlockedUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserService.UserResponse> list() {
        return userService.listBlockedUsers();
    }

    @PostMapping("/{id}/unlock")
    public UserService.UserResponse unlock(@PathVariable Long id, @RequestBody(required = false) UnlockRequest body) {
        String newPassword = body != null ? body.newPassword() : null;
        boolean temporal = body != null && Boolean.TRUE.equals(body.temporalPassword());
        return userService.unlockUser(id, newPassword, temporal);
    }

    public record UnlockRequest(String newPassword, Boolean temporalPassword) {}
}
