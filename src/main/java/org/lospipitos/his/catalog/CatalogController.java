package org.lospipitos.his.catalog;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/catalog")
@PreAuthorize("isAuthenticated()")
public class CatalogController {

    private final TipoCatalogoRepository tipoCatalogoRepository;
    private final CatalogoRepository catalogoRepository;

    public CatalogController(TipoCatalogoRepository tipoCatalogoRepository, CatalogoRepository catalogoRepository) {
        this.tipoCatalogoRepository = tipoCatalogoRepository;
        this.catalogoRepository = catalogoRepository;
    }

    @GetMapping("/tipos")
    public List<TipoDto> tipos() {
        return tipoCatalogoRepository.findAll().stream()
                .filter(TipoCatalogo::isActivo)
                .map(t -> new TipoDto(t.getId(), t.getCodigo(), t.getNombre()))
                .collect(Collectors.toList());
    }

    @GetMapping("/by-tipo/{codigoTipo}")
    public List<CatalogoDto> byTipo(@PathVariable String codigoTipo) {
        return catalogoRepository.findByTipoCodigo(codigoTipo).stream()
                .map(c -> new CatalogoDto(c.getId(), c.getCodigo(), c.getNombre(), c.getOrden(), c.getParentCatalogo() != null ? c.getParentCatalogo().getId() : null))
                .collect(Collectors.toList());
    }

    @GetMapping("/especialidades/unidades")
    public List<UnidadEspecialidadesDto> especialidadesPorUnidad() {
        List<Catalogo> unidades = catalogoRepository.findByTipoCodigoRoot("UNIDAD_OPERATIVA");
        List<Catalogo> especialidades = catalogoRepository.findByTipoCodigo("ESPECIALIDAD");
        return unidades.stream().map(unidad -> {
            List<CatalogoDto> hijos = especialidades.stream()
                    .filter(e -> e.getParentCatalogo() != null && unidad.getId().equals(e.getParentCatalogo().getId()))
                    .map(c -> new CatalogoDto(c.getId(), c.getCodigo(), c.getNombre(), c.getOrden(), unidad.getId()))
                    .collect(Collectors.toList());
            return new UnidadEspecialidadesDto(
                    new CatalogoDto(unidad.getId(), unidad.getCodigo(), unidad.getNombre(), unidad.getOrden(), null),
                    hijos
            );
        }).collect(Collectors.toList());
    }

    @PostMapping("/especialidades")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public CatalogoDto crearEspecialidad(@RequestBody NuevaEspecialidadRequest body) {
        if (body.unidadCatalogoId() == null) {
            throw new IllegalArgumentException("Debe indicar unidadCatalogoId");
        }
        if (body.nombre() == null || body.nombre().trim().isEmpty()) {
            throw new IllegalArgumentException("Debe indicar el nombre de la especialidad");
        }
        Catalogo unidad = catalogoRepository.findByIdWithTipoCatalogo(body.unidadCatalogoId())
                .orElseThrow(() -> new IllegalArgumentException("Unidad operativa no encontrada"));
        if (!"UNIDAD_OPERATIVA".equalsIgnoreCase(unidad.getTipoCatalogo().getCodigo())) {
            throw new IllegalArgumentException("La unidad seleccionada no pertenece a UNIDAD_OPERATIVA");
        }
        TipoCatalogo tipoEspecialidad = tipoCatalogoRepository.findByCodigo("ESPECIALIDAD")
                .orElseThrow(() -> new IllegalStateException("Tipo catálogo ESPECIALIDAD no configurado"));
        String nombre = body.nombre().trim();
        String codigo = normalizeCode(body.codigo() != null && !body.codigo().trim().isEmpty() ? body.codigo().trim() : nombre);
        if (catalogoRepository.findByTipoCodigoAndCodigoIgnoreCase("ESPECIALIDAD", codigo).isPresent()) {
            throw new IllegalArgumentException("Ya existe una especialidad con código " + codigo);
        }
        int orden = body.orden() != null ? body.orden() : nextOrden(unidad.getId());
        Catalogo c = new Catalogo();
        c.setTipoCatalogo(tipoEspecialidad);
        c.setParentCatalogo(unidad);
        c.setCodigo(codigo);
        c.setNombre(nombre);
        c.setOrden(orden);
        c.setActivo(true);
        Catalogo saved = catalogoRepository.save(c);
        return new CatalogoDto(saved.getId(), saved.getCodigo(), saved.getNombre(), saved.getOrden(), unidad.getId());
    }

    @PostMapping("/unidades-operativas")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public CatalogoDto crearUnidadOperativa(@RequestBody NuevaUnidadOperativaRequest body) {
        if (body.nombre() == null || body.nombre().trim().isEmpty()) {
            throw new IllegalArgumentException("Debe indicar el nombre de la categoría");
        }
        if (body.codigo() == null || body.codigo().trim().isEmpty()) {
            throw new IllegalArgumentException("Debe indicar el código de la categoría");
        }
        TipoCatalogo tipoUnidad = tipoCatalogoRepository.findByCodigo("UNIDAD_OPERATIVA")
                .orElseThrow(() -> new IllegalStateException("Tipo catálogo UNIDAD_OPERATIVA no configurado"));
        String nombre = body.nombre().trim();
        String codigo = normalizeCode(body.codigo().trim());
        if (catalogoRepository.findByTipoCodigoAndCodigoIgnoreCase("UNIDAD_OPERATIVA", codigo).isPresent()) {
            throw new IllegalArgumentException("Ya existe una categoría con código " + codigo);
        }
        int orden = nextOrdenUnidadOperativa();
        Catalogo c = new Catalogo();
        c.setTipoCatalogo(tipoUnidad);
        c.setParentCatalogo(null);
        c.setCodigo(codigo);
        c.setNombre(nombre);
        c.setOrden(orden);
        c.setActivo(true);
        Catalogo saved = catalogoRepository.save(c);
        return new CatalogoDto(saved.getId(), saved.getCodigo(), saved.getNombre(), saved.getOrden(), null);
    }

    @PatchMapping("/unidades-operativas/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Transactional
    public CatalogoDto actualizarUnidadOperativa(@PathVariable Long id, @RequestBody ActualizarCatalogoRequest body) {
        if (body.nombre() == null || body.nombre().trim().isEmpty()) {
            throw new IllegalArgumentException("Debe indicar el nombre");
        }
        if (body.codigo() == null || body.codigo().trim().isEmpty()) {
            throw new IllegalArgumentException("Debe indicar el código");
        }
        Catalogo c = catalogoRepository.findByIdWithTipoCatalogo(id)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));
        if (!"UNIDAD_OPERATIVA".equalsIgnoreCase(c.getTipoCatalogo().getCodigo())) {
            throw new IllegalArgumentException("El registro no es una categoría (unidad operativa)");
        }
        String codigo = normalizeCode(body.codigo().trim());
        catalogoRepository.findByTipoCodigoAndCodigoIgnoreCase("UNIDAD_OPERATIVA", codigo)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(x -> {
                    throw new IllegalArgumentException("Ya existe otra categoría con código " + codigo);
                });
        c.setNombre(body.nombre().trim());
        c.setCodigo(codigo);
        Catalogo saved = catalogoRepository.save(c);
        return new CatalogoDto(saved.getId(), saved.getCodigo(), saved.getNombre(), saved.getOrden(), null);
    }

    @PatchMapping("/especialidades/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Transactional
    public CatalogoDto actualizarEspecialidad(@PathVariable Long id, @RequestBody ActualizarEspecialidadRequest body) {
        if (body.nombre() == null || body.nombre().trim().isEmpty()) {
            throw new IllegalArgumentException("Debe indicar el nombre");
        }
        Catalogo esp = catalogoRepository.findByIdWithTipoAndParent(id)
                .orElseThrow(() -> new IllegalArgumentException("Especialidad no encontrada"));
        if (!"ESPECIALIDAD".equalsIgnoreCase(esp.getTipoCatalogo().getCodigo())) {
            throw new IllegalArgumentException("El registro no es una especialidad");
        }
        String codigo = normalizeCode(
                body.codigo() != null && !body.codigo().trim().isEmpty() ? body.codigo().trim() : body.nombre().trim());
        catalogoRepository.findByTipoCodigoAndCodigoIgnoreCase("ESPECIALIDAD", codigo)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(x -> {
                    throw new IllegalArgumentException("Ya existe otra especialidad con código " + codigo);
                });
        esp.setNombre(body.nombre().trim());
        esp.setCodigo(codigo);

        if (body.unidadCatalogoId() != null) {
            Catalogo nuevaUnidad = catalogoRepository.findByIdWithTipoCatalogo(body.unidadCatalogoId())
                    .orElseThrow(() -> new IllegalArgumentException("Unidad operativa no encontrada"));
            if (!"UNIDAD_OPERATIVA".equalsIgnoreCase(nuevaUnidad.getTipoCatalogo().getCodigo())) {
                throw new IllegalArgumentException("La unidad seleccionada no es válida");
            }
            Catalogo actualParent = esp.getParentCatalogo();
            if (actualParent == null || !nuevaUnidad.getId().equals(actualParent.getId())) {
                esp.setParentCatalogo(nuevaUnidad);
                esp.setOrden(nextOrden(nuevaUnidad.getId()));
            }
        }

        Catalogo saved = catalogoRepository.save(esp);
        Long parentId = saved.getParentCatalogo() != null ? saved.getParentCatalogo().getId() : null;
        return new CatalogoDto(saved.getId(), saved.getCodigo(), saved.getNombre(), saved.getOrden(), parentId);
    }

    @GetMapping("/recursos")
    public List<CatalogoDetalleDto> recursos() {
        return catalogoRepository.findAllByTipoCodigo("RECURSO_CLINICO").stream()
                .map(c -> new CatalogoDetalleDto(c.getId(), c.getCodigo(), c.getNombre(), c.getOrden(), c.isActivo()))
                .collect(Collectors.toList());
    }

    @PostMapping("/recursos")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    public CatalogoDetalleDto crearRecurso(@RequestBody RecursoRequest body) {
        if (body.nombre() == null || body.nombre().trim().isEmpty()) {
            throw new IllegalArgumentException("Debe indicar el nombre del recurso");
        }
        TipoCatalogo tipo = tipoCatalogoRepository.findByCodigo("RECURSO_CLINICO")
                .orElseThrow(() -> new IllegalStateException("Tipo catálogo RECURSO_CLINICO no configurado"));
        String nombre = body.nombre().trim();
        String codigo = normalizeCode(
                body.codigo() != null && !body.codigo().trim().isEmpty() ? body.codigo().trim() : body.nombre().trim());
        if (catalogoRepository.findByTipoCodigoAndCodigoIgnoreCase("RECURSO_CLINICO", codigo).isPresent()) {
            throw new IllegalArgumentException("Ya existe un recurso con código " + codigo);
        }
        Catalogo c = new Catalogo();
        c.setTipoCatalogo(tipo);
        c.setParentCatalogo(null);
        c.setCodigo(codigo);
        c.setNombre(nombre);
        c.setOrden(nextOrdenRecursoClinico());
        c.setActivo(body.activo() == null || body.activo());
        Catalogo saved = catalogoRepository.save(c);
        return new CatalogoDetalleDto(saved.getId(), saved.getCodigo(), saved.getNombre(), saved.getOrden(), saved.isActivo());
    }

    @PatchMapping("/recursos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINADOR')")
    @Transactional
    public CatalogoDetalleDto actualizarRecurso(@PathVariable Long id, @RequestBody RecursoRequest body) {
        if (body.nombre() == null || body.nombre().trim().isEmpty()) {
            throw new IllegalArgumentException("Debe indicar el nombre del recurso");
        }
        Catalogo c = catalogoRepository.findByIdWithTipoCatalogo(id)
                .orElseThrow(() -> new IllegalArgumentException("Recurso no encontrado"));
        if (!"RECURSO_CLINICO".equalsIgnoreCase(c.getTipoCatalogo().getCodigo())) {
            throw new IllegalArgumentException("El registro no pertenece al catálogo de recursos clínicos");
        }
        String codigo = normalizeCode(
                body.codigo() != null && !body.codigo().trim().isEmpty() ? body.codigo().trim() : body.nombre().trim());
        catalogoRepository.findByTipoCodigoAndCodigoIgnoreCase("RECURSO_CLINICO", codigo)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(x -> {
                    throw new IllegalArgumentException("Ya existe otro recurso con código " + codigo);
                });
        c.setNombre(body.nombre().trim());
        c.setCodigo(codigo);
        if (body.activo() != null) c.setActivo(body.activo());
        Catalogo saved = catalogoRepository.save(c);
        return new CatalogoDetalleDto(saved.getId(), saved.getCodigo(), saved.getNombre(), saved.getOrden(), saved.isActivo());
    }

    private int nextOrdenUnidadOperativa() {
        List<Catalogo> existing = catalogoRepository.findByTipoCodigoRoot("UNIDAD_OPERATIVA");
        if (existing.isEmpty()) {
            return 1;
        }
        int max = 0;
        for (Catalogo item : existing) {
            if (item.getOrden() > max) {
                max = item.getOrden();
            }
        }
        return max + 1;
    }

    private int nextOrden(Long unidadId) {
        List<Catalogo> existing = catalogoRepository.findByTipoCodigoAndParentId("ESPECIALIDAD", unidadId);
        if (existing.isEmpty()) return 1;
        int max = 0;
        for (Catalogo item : existing) {
            if (item.getOrden() > max) max = item.getOrden();
        }
        return max + 1;
    }

    private int nextOrdenRecursoClinico() {
        List<Catalogo> existing = catalogoRepository.findAllByTipoCodigo("RECURSO_CLINICO");
        if (existing.isEmpty()) return 1;
        int max = 0;
        for (Catalogo item : existing) {
            if (item.getOrden() > max) max = item.getOrden();
        }
        return max + 1;
    }

    private String normalizeCode(String raw) {
        String normalized = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        return normalized.isEmpty() ? "ITEM" : normalized;
    }

    public record TipoDto(Long id, String codigo, String nombre) {}

    public record CatalogoDto(Long id, String codigo, String nombre, int orden, Long parentCatalogoId) {}

    public record CatalogoDetalleDto(Long id, String codigo, String nombre, int orden, boolean activo) {}

    public record UnidadEspecialidadesDto(CatalogoDto unidad, List<CatalogoDto> especialidades) {}

    public record NuevaEspecialidadRequest(Long unidadCatalogoId, String nombre, String codigo, Integer orden) {}

    public record NuevaUnidadOperativaRequest(String nombre, String codigo) {}

    public record ActualizarCatalogoRequest(String nombre, String codigo) {}

    public record ActualizarEspecialidadRequest(String nombre, String codigo, Long unidadCatalogoId) {}

    public record RecursoRequest(String nombre, String codigo, Boolean activo) {}
}
