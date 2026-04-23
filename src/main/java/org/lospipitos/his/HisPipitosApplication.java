package org.lospipitos.his;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(HisProperties.class)
public class HisPipitosApplication {

    public static void main(String[] args) {
        SpringApplication.run(HisPipitosApplication.class, args);
    }
}
