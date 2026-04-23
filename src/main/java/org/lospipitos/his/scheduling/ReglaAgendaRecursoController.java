package org.lospipitos.his.scheduling;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/agenda/reglas-recurso")
@PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
public class ReglaAgendaRecursoController {

    private final ReglaAgendaRecursoRepository reglaAgendaRecursoRepository;

    public ReglaAgendaRecursoController(ReglaAgendaRecursoRepository reglaAgendaRecursoRepository) {
        this.reglaAgendaRecursoRepository = reglaAgendaRecursoRepository;
    }

    @GetMapping
    public List<ReglaAgendaRecurso> listar(
            @RequestParam String recursoTipo, @RequestParam Long recursoId) {
        return reglaAgendaRecursoRepository.findByRecursoTipoAndRecursoIdAndActivoTrue(recursoTipo, recursoId);
    }

    @PostMapping
    public ReglaAgendaRecurso crear(@RequestBody ReglaAgendaRecurso body) {
        body.setId(null);
        return reglaAgendaRecursoRepository.save(body);
    }

    @DeleteMapping("/{id}")
    public void borrar(@PathVariable Long id) {
        reglaAgendaRecursoRepository.deleteById(id);
    }
}
