package org.lospipitos.his.scheduling;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "politica_cancelacion")
public class PoliticaCancelacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "horas_minimas_cancelacion_paciente", nullable = false)
    private int horasMinimasCancelacionPaciente = 24;

    public Long getId() {
        return id;
    }

    public int getHorasMinimasCancelacionPaciente() {
        return horasMinimasCancelacionPaciente;
    }

    public void setHorasMinimasCancelacionPaciente(int horasMinimasCancelacionPaciente) {
        this.horasMinimasCancelacionPaciente = horasMinimasCancelacionPaciente;
    }
}
