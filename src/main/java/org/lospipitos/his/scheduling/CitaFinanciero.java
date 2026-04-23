package org.lospipitos.his.scheduling;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "cita_financiero")
public class CitaFinanciero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cita_id", unique = true, nullable = false)
    private Cita cita;

    @Column(name = "monto_ingreso", nullable = false, precision = 19, scale = 2)
    private BigDecimal montoIngreso = BigDecimal.ZERO;

    @Column(name = "monto_costo", nullable = false, precision = 19, scale = 2)
    private BigDecimal montoCosto = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    private String moneda = "NIO";

    private String notas;

    public Long getId() {
        return id;
    }

    public Cita getCita() {
        return cita;
    }

    public void setCita(Cita cita) {
        this.cita = cita;
    }

    public BigDecimal getMontoIngreso() {
        return montoIngreso;
    }

    public void setMontoIngreso(BigDecimal montoIngreso) {
        this.montoIngreso = montoIngreso;
    }

    public BigDecimal getMontoCosto() {
        return montoCosto;
    }

    public void setMontoCosto(BigDecimal montoCosto) {
        this.montoCosto = montoCosto;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }
}
