package org.lospipitos.his.scheduling;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalTime;

@Entity
@Table(name = "regla_agenda_recurso")
public class ReglaAgendaRecurso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recurso_tipo", nullable = false, length = 20)
    private String recursoTipo;

    @Column(name = "recurso_id", nullable = false)
    private Long recursoId;

    @Column(name = "dia_semana")
    private Short diaSemana;

    @Column(name = "franja_inicio")
    private LocalTime franjaInicio;

    @Column(name = "franja_fin")
    private LocalTime franjaFin;

    @Column(name = "max_citas_dia")
    private Integer maxCitasDia;

    @Column(name = "max_citas_hora")
    private Integer maxCitasHora;

    @Column(name = "buffer_antes_min", nullable = false)
    private int bufferAntesMin = 0;

    @Column(name = "buffer_despues_min", nullable = false)
    private int bufferDespuesMin = 0;

    @Column(nullable = false)
    private boolean activo = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRecursoTipo() {
        return recursoTipo;
    }

    public void setRecursoTipo(String recursoTipo) {
        this.recursoTipo = recursoTipo;
    }

    public Long getRecursoId() {
        return recursoId;
    }

    public void setRecursoId(Long recursoId) {
        this.recursoId = recursoId;
    }

    public Short getDiaSemana() {
        return diaSemana;
    }

    public void setDiaSemana(Short diaSemana) {
        this.diaSemana = diaSemana;
    }

    public LocalTime getFranjaInicio() {
        return franjaInicio;
    }

    public void setFranjaInicio(LocalTime franjaInicio) {
        this.franjaInicio = franjaInicio;
    }

    public LocalTime getFranjaFin() {
        return franjaFin;
    }

    public void setFranjaFin(LocalTime franjaFin) {
        this.franjaFin = franjaFin;
    }

    public Integer getMaxCitasDia() {
        return maxCitasDia;
    }

    public void setMaxCitasDia(Integer maxCitasDia) {
        this.maxCitasDia = maxCitasDia;
    }

    public Integer getMaxCitasHora() {
        return maxCitasHora;
    }

    public void setMaxCitasHora(Integer maxCitasHora) {
        this.maxCitasHora = maxCitasHora;
    }

    public int getBufferAntesMin() {
        return bufferAntesMin;
    }

    public void setBufferAntesMin(int bufferAntesMin) {
        this.bufferAntesMin = bufferAntesMin;
    }

    public int getBufferDespuesMin() {
        return bufferDespuesMin;
    }

    public void setBufferDespuesMin(int bufferDespuesMin) {
        this.bufferDespuesMin = bufferDespuesMin;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
