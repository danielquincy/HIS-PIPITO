package org.lospipitos.his.scheduling;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class AgendaRulesValidator {

    private final ReglaAgendaRecursoRepository reglaAgendaRecursoRepository;
    private final CitaRepository citaRepository;

    public AgendaRulesValidator(
            ReglaAgendaRecursoRepository reglaAgendaRecursoRepository, CitaRepository citaRepository) {
        this.reglaAgendaRecursoRepository = reglaAgendaRecursoRepository;
        this.citaRepository = citaRepository;
    }

    public void validateEspecialistaDia(Long especialistaId, Instant inicio, Instant fin) {
        if (especialistaId == null) return;
        ZoneId z = ZoneId.systemDefault();
        Instant dayStart = inicio.atZone(z).toLocalDate().atStartOfDay(z).toInstant();
        Instant dayEnd = dayStart.plus(1, ChronoUnit.DAYS);
        List<ReglaAgendaRecurso> reglas =
                reglaAgendaRecursoRepository.findByRecursoTipoAndRecursoIdAndActivoTrue("ESPECIALISTA", especialistaId);
        for (ReglaAgendaRecurso r : reglas) {
            if (r.getMaxCitasDia() == null) continue;
            long count = citaRepository.countActivasEspecialistaEnVentana(especialistaId, dayStart, dayEnd);
            if (count >= r.getMaxCitasDia()) {
                throw new IllegalArgumentException(
                        "Se alcanzó el máximo de citas por día para este especialista según reglas de agenda.");
            }
            break;
        }
    }

    public void validateSalaDia(Long salaId, Instant inicio, Instant fin) {
        if (salaId == null) return;
        ZoneId z = ZoneId.systemDefault();
        Instant dayStart = inicio.atZone(z).toLocalDate().atStartOfDay(z).toInstant();
        Instant dayEnd = dayStart.plus(1, ChronoUnit.DAYS);
        List<ReglaAgendaRecurso> reglas =
                reglaAgendaRecursoRepository.findByRecursoTipoAndRecursoIdAndActivoTrue("SALA", salaId);
        for (ReglaAgendaRecurso r : reglas) {
            if (r.getMaxCitasDia() == null) continue;
            long count = citaRepository.countActivasSalaEnVentana(salaId, dayStart, dayEnd);
            if (count >= r.getMaxCitasDia()) {
                throw new IllegalArgumentException(
                        "Se alcanzó el máximo de citas por día para esta sala según reglas de agenda.");
            }
            break;
        }
    }
}
