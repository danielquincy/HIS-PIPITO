package org.lospipitos.his.fhir;

import org.lospipitos.his.patient.Paciente;
import org.lospipitos.his.patient.PacienteRepository;
import org.lospipitos.his.scheduling.Cita;
import org.lospipitos.his.scheduling.CitaRepository;
import org.lospipitos.his.scheduling.Sala;
import org.lospipitos.his.scheduling.SalaRepository;
import org.lospipitos.his.staff.Especialista;
import org.lospipitos.his.staff.EspecialistaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Fachada de solo lectura (FHIR R4 simplificado) para integraciones externas. Los identificadores coinciden con
 * los del HIS (paciente, especialista, cita, sala).
 */
@RestController
@RequestMapping("/api/fhir/r4")
@PreAuthorize("isAuthenticated()")
public class FhirR4ReadController {

    private final PacienteRepository pacienteRepository;
    private final EspecialistaRepository especialistaRepository;
    private final CitaRepository citaRepository;
    private final SalaRepository salaRepository;

    public FhirR4ReadController(
            PacienteRepository pacienteRepository,
            EspecialistaRepository especialistaRepository,
            CitaRepository citaRepository,
            SalaRepository salaRepository) {
        this.pacienteRepository = pacienteRepository;
        this.especialistaRepository = especialistaRepository;
        this.citaRepository = citaRepository;
        this.salaRepository = salaRepository;
    }

    @GetMapping("/Patient/{id}")
    public Map<String, Object> patient(@PathVariable long id) {
        Paciente p = pacienteRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("resourceType", "Patient");
        m.put("id", String.valueOf(p.getId()));
        List<Map<String, Object>> ids = new ArrayList<>();
        Map<String, Object> id0 = new LinkedHashMap<>();
        id0.put("system", "urn:his:expediente");
        id0.put("value", p.getNumeroExpediente());
        ids.add(id0);
        m.put("identifier", ids);
        Map<String, Object> name = new LinkedHashMap<>();
        name.put("family", p.getApellidos());
        name.put("given", List.of(p.getNombres()));
        m.put("name", List.of(name));
        m.put("active", p.isActivo());
        return m;
    }

    @GetMapping("/Practitioner/{id}")
    public Map<String, Object> practitioner(@PathVariable long id) {
        Especialista e = especialistaRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var st = e.getStaff();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("resourceType", "Practitioner");
        m.put("id", String.valueOf(e.getId()));
        Map<String, Object> name = new LinkedHashMap<>();
        name.put("family", st.getApellidos());
        name.put("given", List.of(st.getNombres()));
        m.put("name", List.of(name));
        m.put("active", e.isActivo());
        return m;
    }

    @GetMapping("/Location/{id}")
    public Map<String, Object> location(@PathVariable long id) {
        Sala s = salaRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("resourceType", "Location");
        m.put("id", String.valueOf(s.getId()));
        m.put("name", s.getNombre());
        m.put("status", s.isActivo() ? "active" : "inactive");
        return m;
    }

    @GetMapping("/Appointment/{id}")
    public Map<String, Object> appointment(@PathVariable long id) {
        Cita c = citaRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("resourceType", "Appointment");
        m.put("id", String.valueOf(c.getId()));
        m.put("start", c.getInicioTs().toString());
        m.put("end", c.getFinTs().toString());
        m.put("minutesDuration", c.getDuracionMinutos());
        m.put("description", c.getNotas());
        m.put("status", mapAppointmentStatus(c.getEstado()));
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(participantPatient(c.getPaciente().getId()));
        parts.add(participantPractitioner(c.getEspecialista().getId()));
        if (c.getSala() != null) {
            parts.add(participantLocation(c.getSala().getId()));
        }
        m.put("participant", parts);
        return m;
    }

    private static String mapAppointmentStatus(String estado) {
        if (estado == null) return "proposed";
        return switch (estado) {
            case "PROGRAMADA" -> "booked";
            case "COMPLETADA" -> "fulfilled";
            case "CANCELADA" -> "cancelled";
            case "NO_ASISTIO" -> "noshow";
            default -> "proposed";
        };
    }

    private static Map<String, Object> participantPatient(long patientId) {
        Map<String, Object> p = new LinkedHashMap<>();
        Map<String, Object> actor = new LinkedHashMap<>();
        actor.put("reference", "Patient/" + patientId);
        p.put("actor", actor);
        p.put("status", "accepted");
        p.put("required", "required");
        return p;
    }

    private static Map<String, Object> participantPractitioner(long espId) {
        Map<String, Object> p = new LinkedHashMap<>();
        Map<String, Object> actor = new LinkedHashMap<>();
        actor.put("reference", "Practitioner/" + espId);
        p.put("actor", actor);
        p.put("status", "accepted");
        p.put("required", "required");
        return p;
    }

    private static Map<String, Object> participantLocation(long salaId) {
        Map<String, Object> p = new LinkedHashMap<>();
        Map<String, Object> actor = new LinkedHashMap<>();
        actor.put("reference", "Location/" + salaId);
        p.put("actor", actor);
        p.put("status", "accepted");
        p.put("required", "optional");
        return p;
    }
}
