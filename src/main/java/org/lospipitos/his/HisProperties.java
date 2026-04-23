package org.lospipitos.his;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Collection;
import java.util.List;

@ConfigurationProperties(prefix = "his")
public record HisProperties(
        String issuerUri,
        Admin admin,
        String storagePath,
        List<String> iamMasterRoles
) {
    public record Admin(String username, String password) {}

    /**
     * Roles que pueden acceder al subsistema IAM (launcher y /iam). Por defecto: administrador y maestro IAM.
     */
    public boolean isIamMaster(Collection<String> roleNames) {
        List<String> masters =
                iamMasterRoles == null || iamMasterRoles.isEmpty()
                        ? List.of("ROLE_ADMIN", "ROLE_IAM_MASTER")
                        : iamMasterRoles;
        return roleNames.stream().anyMatch(masters::contains);
    }
}
