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
import org.lospipitos.his.catalog.Catalogo;
import org.lospipitos.his.patient.Paciente;
import org.lospipitos.his.staff.Especialista;

import java.time.Instant;

@Entity
@Table(name = "cita")
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "especialista_id")
    private Especialista especialista;

    @Column(name = "inicio_ts", nullable = false)
    private Instant inicioTs;

    @Column(name = "fin_ts", nullable = false)
    private Instant finTs;

    @Column(name = "duracion_minutos", nullable = false)
    private int duracionMinutos = 45;

    @Column(nullable = false, length = 40)
    private String estado;

    private String notas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_cita_catalogo_id")
    private Catalogo tipoCita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id")
    private Sala sala;

    @Column(name = "motivo_texto", length = 500)
    private String motivoTexto;

    @Column(nullable = false, length = 40)
    private String origen = "INTERNO";

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by_user_id")
    private Long cancelledByUserId;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @Column(name = "inasistencia_marcada_at")
    private Instant inasistenciaMarcadaAt;

    @Column(name = "inasistencia_marcada_by_user_id")
    private Long inasistenciaMarcadaByUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public void setPaciente(Paciente paciente) {
        this.paciente = paciente;
    }

    public Especialista getEspecialista() {
        return especialista;
    }

    public void setEspecialista(Especialista especialista) {
        this.especialista = especialista;
    }

    public Instant getInicioTs() {
        return inicioTs;
    }

    public void setInicioTs(Instant inicioTs) {
        this.inicioTs = inicioTs;
    }

    public Instant getFinTs() {
        return finTs;
    }

    public void setFinTs(Instant finTs) {
        this.finTs = finTs;
    }

    public int getDuracionMinutos() {
        return duracionMinutos;
    }

    public void setDuracionMinutos(int duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Catalogo getTipoCita() {
        return tipoCita;
    }

    public void setTipoCita(Catalogo tipoCita) {
        this.tipoCita = tipoCita;
    }

    public Sala getSala() {
        return sala;
    }

    public void setSala(Sala sala) {
        this.sala = sala;
    }

    public String getMotivoTexto() {
        return motivoTexto;
    }

    public void setMotivoTexto(String motivoTexto) {
        this.motivoTexto = motivoTexto;
    }

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getUpdatedByUserId() {
        return updatedByUserId;
    }

    public void setUpdatedByUserId(Long updatedByUserId) {
        this.updatedByUserId = updatedByUserId;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Long getCancelledByUserId() {
        return cancelledByUserId;
    }

    public void setCancelledByUserId(Long cancelledByUserId) {
        this.cancelledByUserId = cancelledByUserId;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public Instant getInasistenciaMarcadaAt() {
        return inasistenciaMarcadaAt;
    }

    public void setInasistenciaMarcadaAt(Instant inasistenciaMarcadaAt) {
        this.inasistenciaMarcadaAt = inasistenciaMarcadaAt;
    }

    public Long getInasistenciaMarcadaByUserId() {
        return inasistenciaMarcadaByUserId;
    }

    public void setInasistenciaMarcadaByUserId(Long inasistenciaMarcadaByUserId) {
        this.inasistenciaMarcadaByUserId = inasistenciaMarcadaByUserId;
    }
}
