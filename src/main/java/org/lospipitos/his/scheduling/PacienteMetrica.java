package org.lospipitos.his.scheduling;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "paciente_metrica")
public class PacienteMetrica {

    @Id
    @Column(name = "paciente_id")
    private Long pacienteId;

    @Column(name = "no_show_total", nullable = false)
    private int noShowTotal;

    @Column(name = "no_show_ultima_ts")
    private Instant noShowUltimaTs;

    public Long getPacienteId() {
        return pacienteId;
    }

    public void setPacienteId(Long pacienteId) {
        this.pacienteId = pacienteId;
    }

    public int getNoShowTotal() {
        return noShowTotal;
    }

    public void setNoShowTotal(int noShowTotal) {
        this.noShowTotal = noShowTotal;
    }

    public Instant getNoShowUltimaTs() {
        return noShowUltimaTs;
    }

    public void setNoShowUltimaTs(Instant noShowUltimaTs) {
        this.noShowUltimaTs = noShowUltimaTs;
    }
}
