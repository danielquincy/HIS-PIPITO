package org.lospipitos.his.config;

import org.lospipitos.his.HisProperties;
import org.lospipitos.his.iam.AppUser;
import org.lospipitos.his.iam.Role;
import org.lospipitos.his.iam.RoleRepository;
import org.lospipitos.his.iam.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminBootstrapService {

    private final HisProperties hisProperties;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrapService(
            HisProperties hisProperties,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.hisProperties = hisProperties;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void ensureDefaultAdmin() {
        if (userRepository.existsByUsername(hisProperties.admin().username())) {
            return;
        }
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN no existe; revise migraciones"));
        Role iamMasterRole = roleRepository.findByName("ROLE_IAM_MASTER")
                .orElseThrow(() -> new IllegalStateException("ROLE_IAM_MASTER no existe; revise migraciones"));
        AppUser admin = new AppUser();
        admin.setUsername(hisProperties.admin().username());
        admin.setEmail("admin@lospipitos.org");
        admin.setPasswordHash(passwordEncoder.encode(hisProperties.admin().password()));
        admin.setEnabled(true);
        admin.getRoles().add(adminRole);
        admin.getRoles().add(iamMasterRole);
        userRepository.save(admin);
    }
}
