package org.lospipitos.his.iam;

import com.nimbusds.jose.jwk.RSAKey;
import org.lospipitos.his.HisProperties;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JwtTokenService {

    private static final long ACCESS_TOKEN_TTL_HOURS = 8;

    private final JwtEncoder jwtEncoder;
    private final RSAKey rsaKey;
    private final HisProperties hisProperties;

    public JwtTokenService(JwtEncoder jwtEncoder, RSAKey rsaKey, HisProperties hisProperties) {
        this.jwtEncoder = jwtEncoder;
        this.rsaKey = rsaKey;
        this.hisProperties = hisProperties;
    }

    public Jwt createAccessToken(Authentication authentication, AppUser user) {
        Instant now = Instant.now();
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(hisProperties.issuerUri())
                .subject(authentication.getName())
                .issuedAt(now)
                .expiresAt(now.plus(ACCESS_TOKEN_TTL_HOURS, ChronoUnit.HOURS))
                .claim("roles", roles)
                .claim("scope", "openid api.read")
                .claim("password_must_change", user.isPasswordMustChange())
                .build();
        JwsHeader header = JwsHeader.with(() -> "RS256").keyId(rsaKey.getKeyID()).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims));
    }
}
