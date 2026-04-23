package org.lospipitos.his.scheduling;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public void notifyWaitListCandidate(CitaListaEspera entry) {
        log.info(
                "Lista de espera: candidato id={} paciente={} especialista={}",
                entry.getId(),
                entry.getPaciente().getId(),
                entry.getEspecialista() != null ? entry.getEspecialista().getId() : null);
    }

    public void notifyCitaCancelada(Cita c) {
        log.info("Cita cancelada id={} paciente={}", c.getId(), c.getPaciente().getId());
    }
}
