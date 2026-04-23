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
import org.lospipitos.his.iam.AppUser;
import org.lospipitos.his.patient.Paciente;

import java.time.Instant;

@Entity
@Table(name = "paciente_consentimiento")
public class PacienteConsentimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @Column(name = "version_etiqueta", nullable = false, length = 80)
    private String versionEtiqueta;

    @Column(name = "texto_resumen", length = 2000)
    private String textoResumen;

    @Column(length = 40)
    private String canal;

    @Column(name = "aceptado_ts", nullable = false)
    private Instant aceptadoTs;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private AppUser createdBy;

    public Long getId() {
        return id;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public void setPaciente(Paciente paciente) {
        this.paciente = paciente;
    }

    public String getVersionEtiqueta() {
        return versionEtiqueta;
    }

    public void setVersionEtiqueta(String versionEtiqueta) {
        this.versionEtiqueta = versionEtiqueta;
    }

    public String getTextoResumen() {
        return textoResumen;
    }

    public void setTextoResumen(String textoResumen) {
        this.textoResumen = textoResumen;
    }

    public String getCanal() {
        return canal;
    }

    public void setCanal(String canal) {
        this.canal = canal;
    }

    public Instant getAceptadoTs() {
        return aceptadoTs;
    }

    public void setAceptadoTs(Instant aceptadoTs) {
        this.aceptadoTs = aceptadoTs;
    }

    public AppUser getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(AppUser createdBy) {
        this.createdBy = createdBy;
    }
}
