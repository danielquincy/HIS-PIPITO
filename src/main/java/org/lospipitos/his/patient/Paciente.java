package org.lospipitos.his.patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "paciente")
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombres;

    @Column(nullable = false)
    private String apellidos;

    @Column(name = "numero_expediente", nullable = false, unique = true, length = 64)
    private String numeroExpediente;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    private String telefono;

    private String notas;

    @Column(name = "capacidades_info", columnDefinition = "TEXT")
    private String capacidadesInfo;

    @Column(columnDefinition = "TEXT")
    private String direccion;

    @Column(length = 20)
    private String sexo;

    @Column(name = "responsable_tutor", columnDefinition = "TEXT")
    private String responsableTutor;

    @Column(name = "diagnostico_referencia", columnDefinition = "TEXT")
    private String diagnosticoReferencia;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public String getNombres() {
        return nombres;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public String getApellidos() {
        return apellidos;
    }

    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }

    public String getNumeroExpediente() {
        return numeroExpediente;
    }

    public void setNumeroExpediente(String numeroExpediente) {
        this.numeroExpediente = numeroExpediente;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public String getCapacidadesInfo() {
        return capacidadesInfo;
    }

    public void setCapacidadesInfo(String capacidadesInfo) {
        this.capacidadesInfo = capacidadesInfo;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getSexo() {
        return sexo;
    }

    public void setSexo(String sexo) {
        this.sexo = sexo;
    }

    public String getResponsableTutor() {
        return responsableTutor;
    }

    public void setResponsableTutor(String responsableTutor) {
        this.responsableTutor = responsableTutor;
    }

    public String getDiagnosticoReferencia() {
        return diagnosticoReferencia;
    }

    public void setDiagnosticoReferencia(String diagnosticoReferencia) {
        this.diagnosticoReferencia = diagnosticoReferencia;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
