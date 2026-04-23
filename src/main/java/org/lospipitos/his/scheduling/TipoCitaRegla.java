package org.lospipitos.his.scheduling;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tipo_cita_regla")
public class TipoCitaRegla {

    @Id
    @Column(name = "catalogo_id")
    private Long catalogoId;

    @Column(name = "duracion_minutos", nullable = false)
    private int duracionMinutos = 45;

    @Column(name = "buffer_antes_minutos", nullable = false)
    private int bufferAntesMinutos = 0;

    @Column(name = "buffer_despues_minutos", nullable = false)
    private int bufferDespuesMinutos = 0;

    public Long getCatalogoId() {
        return catalogoId;
    }

    public int getDuracionMinutos() {
        return duracionMinutos;
    }

    public int getBufferAntesMinutos() {
        return bufferAntesMinutos;
    }

    public int getBufferDespuesMinutos() {
        return bufferDespuesMinutos;
    }
}
