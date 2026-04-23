package org.lospipitos.his.scheduling;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "cita_portal_token")
public class CitaPortalToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cita_id")
    private Cita cita;

    @Column(name = "token_hash", nullable = false, unique = true, length = 128)
    private String tokenHash;

    @Column(name = "expira_ts", nullable = false)
    private Instant expiraTs;

    @Column(name = "puede_confirmar", nullable = false)
    private boolean puedeConfirmar = true;

    @Column(name = "puede_cancelar", nullable = false)
    private boolean puedeCancelar = true;

    @Column(name = "puede_reprogramar", nullable = false)
    private boolean puedeReprogramar;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public Cita getCita() {
        return cita;
    }

    public void setCita(Cita cita) {
        this.cita = cita;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public Instant getExpiraTs() {
        return expiraTs;
    }

    public void setExpiraTs(Instant expiraTs) {
        this.expiraTs = expiraTs;
    }

    public boolean isPuedeConfirmar() {
        return puedeConfirmar;
    }

    public void setPuedeConfirmar(boolean puedeConfirmar) {
        this.puedeConfirmar = puedeConfirmar;
    }

    public boolean isPuedeCancelar() {
        return puedeCancelar;
    }

    public void setPuedeCancelar(boolean puedeCancelar) {
        this.puedeCancelar = puedeCancelar;
    }

    public boolean isPuedeReprogramar() {
        return puedeReprogramar;
    }

    public void setPuedeReprogramar(boolean puedeReprogramar) {
        this.puedeReprogramar = puedeReprogramar;
    }
}
