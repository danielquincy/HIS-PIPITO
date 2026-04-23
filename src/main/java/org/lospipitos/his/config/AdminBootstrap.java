package org.lospipitos.his.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminBootstrap {

    @Bean
    ApplicationRunner createDefaultAdmin(AdminBootstrapService adminBootstrapService) {
        return args -> adminBootstrapService.ensureDefaultAdmin();
    }
}
