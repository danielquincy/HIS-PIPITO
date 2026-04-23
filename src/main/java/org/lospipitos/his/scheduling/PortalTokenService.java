package org.lospipitos.his.scheduling;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;

@Service
public class PortalTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CitaPortalTokenRepository citaPortalTokenRepository;
    private final PoliticaCancelacionRepository politicaCancelacionRepository;

    public PortalTokenService(
            CitaPortalTokenRepository citaPortalTokenRepository,
            PoliticaCancelacionRepository politicaCancelacionRepository) {
        this.citaPortalTokenRepository = citaPortalTokenRepository;
        this.politicaCancelacionRepository = politicaCancelacionRepository;
    }

    @Transactional
    public String generarYGuardarToken(Cita cita) {
        byte[] raw = new byte[24];
        RANDOM.nextBytes(raw);
        String token = HexFormat.of().formatHex(raw);
        CitaPortalToken row = new CitaPortalToken();
        row.setCita(cita);
        row.setTokenHash(sha256Hex(token));
        row.setExpiraTs(Instant.now().plus(7, ChronoUnit.DAYS));
        row.setPuedeConfirmar(true);
        row.setPuedeCancelar(true);
        row.setPuedeReprogramar(false);
        citaPortalTokenRepository.save(row);
        return token;
    }

    public static String sha256Hex(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public int horasMinimasCancelacionPaciente() {
        return politicaCancelacionRepository.findAll().stream()
                .findFirst()
                .map(PoliticaCancelacion::getHorasMinimasCancelacionPaciente)
                .orElse(24);
    }
}
