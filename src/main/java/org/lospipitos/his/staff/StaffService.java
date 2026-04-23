package org.lospipitos.his.staff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.lospipitos.his.catalog.Catalogo;
import org.lospipitos.his.catalog.CatalogoRepository;
import org.lospipitos.his.catalog.TipoCatalogo;
import org.lospipitos.his.catalog.TipoCatalogoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Comparator;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final EspecialistaRepository especialistaRepository;
    private final CatalogoRepository catalogoRepository;
    private final TipoCatalogoRepository tipoCatalogoRepository;

    public StaffService(
            StaffRepository staffRepository,
            EspecialistaRepository especialistaRepository,
            CatalogoRepository catalogoRepository,
            TipoCatalogoRepository tipoCatalogoRepository) {
        this.staffRepository = staffRepository;
        this.especialistaRepository = especialistaRepository;
        this.catalogoRepository = catalogoRepository;
        this.tipoCatalogoRepository = tipoCatalogoRepository;
    }

    @Transactional(readOnly = true)
    public List<EspecialistaResponse> listEspecialistas(boolean incluirInactivos) {
        List<Especialista> rows =
                incluirInactivos
                        ? especialistaRepository.findAllWithStaffAndEspecialidades()
                        : especialistaRepository.findAllActivosWithStaff();
        if (incluirInactivos) {
            rows.sort(
                    Comparator.comparing(
                                    (Especialista e) -> e.getStaff().getApellidos(),
                                    String.CASE_INSENSITIVE_ORDER)
                            .thenComparing(e -> e.getStaff().getNombres(), String.CASE_INSENSITIVE_ORDER));
        }
        return rows.stream().map(EspecialistaResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public EspecialistaResponse createEspecialista(CreateEspecialistaRequest req) {
        TipoCatalogo tipoEsp = requireTipoEspecialidad();
        Staff s = new Staff();
        s.setNombres(req.nombres());
        s.setApellidos(req.apellidos());
        s.setEmail(req.email());
        s.setTelefono(req.telefono());
        s.setActivo(true);
        s = staffRepository.save(s);
        Especialista e = new Especialista();
        e.setStaff(s);
        e.setActivo(true);
        Set<Catalogo> cats = resolveEspecialidades(req.especialidadCatalogoIds(), tipoEsp);
        e.setEspecialidades(cats);
        return EspecialistaResponse.from(especialistaRepository.save(e));
    }

    @Transactional
    public EspecialistaResponse updateEspecialidades(Long especialistaId, Set<Long> especialidadCatalogoIds) {
        if (especialidadCatalogoIds == null || especialidadCatalogoIds.isEmpty()) {
            throw new IllegalArgumentException("Debe enviar al menos una especialidad");
        }
        TipoCatalogo tipoEsp = requireTipoEspecialidad();
        Especialista e = especialistaRepository.findByIdWithStaffAndEspecialidades(especialistaId)
                .orElseThrow(() -> new IllegalArgumentException("Especialista no encontrado: " + especialistaId));
        e.setEspecialidades(resolveEspecialidades(especialidadCatalogoIds, tipoEsp));
        return EspecialistaResponse.from(especialistaRepository.save(e));
    }

    @Transactional
    public EspecialistaResponse updateEspecialista(Long id, UpdateEspecialistaRequest req) {
        TipoCatalogo tipoEsp = requireTipoEspecialidad();
        Especialista e = especialistaRepository.findByIdWithStaffAndEspecialidades(id)
                .orElseThrow(() -> new IllegalArgumentException("Especialista no encontrado: " + id));
        Staff s = e.getStaff();
        s.setNombres(req.nombres().trim());
        s.setApellidos(req.apellidos().trim());
        s.setEmail(emptyToNull(req.email()));
        s.setTelefono(emptyToNull(req.telefono()));
        s.setActivo(req.activo());
        e.setActivo(req.activo());
        staffRepository.save(s);
        e.setEspecialidades(resolveEspecialidades(req.especialidadCatalogoIds(), tipoEsp));
        return EspecialistaResponse.from(especialistaRepository.save(e));
    }

    private static String emptyToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private TipoCatalogo requireTipoEspecialidad() {
        return tipoCatalogoRepository.findByCodigo("ESPECIALIDAD")
                .orElseThrow(() -> new IllegalStateException("Catálogo ESPECIALIDAD no configurado"));
    }

    private Set<Catalogo> resolveEspecialidades(Set<Long> especialidadCatalogoIds, TipoCatalogo tipoEsp) {
        Set<Catalogo> cats = new HashSet<>();
        for (Long cid : especialidadCatalogoIds) {
            Catalogo cat = catalogoRepository.findById(cid)
                    .orElseThrow(() -> new IllegalArgumentException("Especialidad no encontrada: " + cid));
            if (!cat.getTipoCatalogo().getId().equals(tipoEsp.getId())) {
                throw new IllegalArgumentException("El catálogo " + cid + " no es una especialidad");
            }
            cats.add(cat);
        }
        return cats;
    }

    public record CreateEspecialistaRequest(
            @NotBlank String nombres,
            @NotBlank String apellidos,
            String email,
            String telefono,
            @NotEmpty Set<Long> especialidadCatalogoIds
    ) {}

    public record UpdateEspecialidadesRequest(@NotEmpty Set<Long> especialidadCatalogoIds) {}

    public record UpdateEspecialistaRequest(
            @NotBlank String nombres,
            @NotBlank String apellidos,
            String email,
            String telefono,
            boolean activo,
            @NotEmpty Set<Long> especialidadCatalogoIds
    ) {}

    public record EspecialistaResponse(
            Long id,
            String nombres,
            String apellidos,
            String email,
            String telefono,
            boolean activo,
            List<String> especialidades,
            List<EspecialidadInfo> especialidadesDetalle
    ) {
        static EspecialistaResponse from(Especialista e) {
            List<String> esp = e.getEspecialidades().stream().map(Catalogo::getNombre).sorted().toList();
            List<EspecialidadInfo> detalle = e.getEspecialidades().stream()
                    .map(c -> new EspecialidadInfo(c.getId(), c.getNombre()))
                    .sorted(Comparator.comparing(EspecialidadInfo::nombre, String.CASE_INSENSITIVE_ORDER))
                    .toList();
            return new EspecialistaResponse(
                    e.getId(),
                    e.getStaff().getNombres(),
                    e.getStaff().getApellidos(),
                    e.getStaff().getEmail(),
                    e.getStaff().getTelefono(),
                    e.isActivo(),
                    esp,
                    detalle);
        }
    }

    public record EspecialidadInfo(Long id, String nombre) {}
}
