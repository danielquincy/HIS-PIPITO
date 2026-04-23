package org.lospipitos.his.iam;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PantallaService {

    private final PantallaRepository pantallaRepository;
    private final RoleRepository roleRepository;

    public PantallaService(PantallaRepository pantallaRepository, RoleRepository roleRepository) {
        this.pantallaRepository = pantallaRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<PantallaDto> listOrdered() {
        return pantallaRepository.findAllOrderedForAdmin().stream()
                .map(PantallaDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Pantallas activas a las que el usuario puede acceder: unión de las pantallas vinculadas
     * a cualquiera de sus roles (iam_pantalla_rol). Si una pantalla no tiene roles asignados,
     * nadie la verá hasta que IAM las enlace.
     */
    @Transactional(readOnly = true)
    public List<PantallaAcceso> listAccessibleForUser(AppUser user) {
        Set<String> roleNames =
                user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        if (roleNames.isEmpty()) {
            return List.of();
        }
        return pantallaRepository.findAccessibleByRoleNames(roleNames).stream()
                .map(p -> new PantallaAcceso(
                        p.getId(),
                        p.getCodigo(),
                        p.getNombre(),
                        p.getRuta(),
                        p.getOrden(),
                        p.getTipo(),
                        p.getParent() != null ? p.getParent().getId() : null))
                .collect(Collectors.toList());
    }

    public record PantallaAcceso(
            Long id,
            String codigo,
            String nombre,
            String ruta,
            int orden,
            TipoPantalla tipo,
            Long parentId) {}

    @Transactional(readOnly = true)
    public PantallaDto get(Long id) {
        Pantalla p = pantallaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pantalla no encontrada"));
        return PantallaDto.from(p);
    }

    @Transactional
    public PantallaDto create(
            String codigo,
            String nombre,
            String descripcion,
            String ruta,
            int orden,
            boolean activo,
            TipoPantalla tipo,
            Long parentId) {
        String c = codigo.trim().toUpperCase(Locale.ROOT);
        if (pantallaRepository.existsByCodigo(c)) {
            throw new IllegalArgumentException("Ya existe una pantalla con ese código");
        }
        String n = normalizeNombre(nombre);
        if (n.isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio y no puede contener solo números.");
        }
        Pantalla parent = resolveParentForSave(parentId, null);
        String rNorm = normalizeRutaForTipo(tipo, ruta);
        assertOrdenUniqueInParent(null, parent, orden);
        Pantalla p = new Pantalla();
        p.setCodigo(c);
        p.setNombre(n);
        p.setDescripcion(descripcion != null ? descripcion.trim() : null);
        p.setRuta(rNorm);
        p.setTipo(tipo);
        p.setParent(parent);
        p.setOrden(orden);
        p.setActivo(activo);
        return PantallaDto.from(pantallaRepository.save(p));
    }

    @Transactional
    public PantallaDto update(
            Long id,
            String codigo,
            String nombre,
            String descripcion,
            String ruta,
            int orden,
            boolean activo,
            TipoPantalla tipo,
            Long parentId) {
        Pantalla p = pantallaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pantalla no encontrada"));
        if (p.getTipo() == TipoPantalla.MENU
                && tipo == TipoPantalla.PANTALLA
                && pantallaRepository.countByParent_Id(id) > 0) {
            throw new IllegalArgumentException(
                    "No puede cambiar a Pantalla mientras tenga menús o pantallas hijas.");
        }
        String c = codigo.trim().toUpperCase(Locale.ROOT);
        if (!c.equals(p.getCodigo()) && pantallaRepository.existsByCodigo(c)) {
            throw new IllegalArgumentException("Ya existe una pantalla con ese código");
        }
        String n = normalizeNombre(nombre);
        if (n.isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio y no puede contener solo números.");
        }
        Pantalla parent = resolveParentForSave(parentId, id);
        String rNorm = normalizeRutaForTipo(tipo, ruta);
        assertOrdenUniqueInParent(id, parent, orden);
        p.setCodigo(c);
        p.setNombre(n);
        p.setDescripcion(descripcion != null ? descripcion.trim() : null);
        p.setRuta(rNorm);
        p.setTipo(tipo);
        p.setParent(parent);
        p.setOrden(orden);
        p.setActivo(activo);
        return PantallaDto.from(pantallaRepository.save(p));
    }

    private Pantalla resolveParentForSave(Long parentId, Long selfId) {
        if (parentId == null) {
            return null;
        }
        Pantalla parent = pantallaRepository
                .findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("El menú padre no existe."));
        if (parent.getTipo() != TipoPantalla.MENU) {
            throw new IllegalArgumentException(
                    "Solo un menú puede ser padre. Las pantallas no pueden contener submenús.");
        }
        if (selfId != null && parentId.equals(selfId)) {
            throw new IllegalArgumentException("Una entrada no puede ser padre de sí misma.");
        }
        assertNoParentCycle(selfId, parent);
        return parent;
    }

    private void assertNoParentCycle(Long selfId, Pantalla ancestor) {
        if (selfId == null) {
            return;
        }
        Pantalla cur = ancestor;
        int guard = 0;
        while (cur != null && guard++ < 256) {
            if (selfId.equals(cur.getId())) {
                throw new IllegalArgumentException("No se puede crear un ciclo en la jerarquía de menús.");
            }
            cur = cur.getParent();
        }
    }

    static String normalizeRutaForTipo(TipoPantalla tipo, String ruta) {
        if (tipo == TipoPantalla.MENU) {
            return "#";
        }
        String n = normalizeRuta(ruta);
        if (n == null || n.isBlank() || "#".equals(n)) {
            throw new IllegalArgumentException(
                    "Las pantallas de tipo Pantalla deben tener una ruta válida (no use # ni vacío).");
        }
        return n;
    }

    static String normalizeRuta(String ruta) {
        if (ruta == null || ruta.isBlank()) {
            return null;
        }
        String s = ruta.trim().toLowerCase(Locale.ROOT).replace('\\', '/');
        if (!s.startsWith("/")) {
            s = "/" + s;
        }
        return s;
    }

    static String normalizeNombre(String nombre) {
        if (nombre == null) {
            return "";
        }
        String s = nombre.replaceAll("\\d", "").trim().replaceAll("\\s+", " ");
        if (s.isEmpty()) {
            return "";
        }
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase(Locale.ROOT);
    }

    private void assertOrdenUniqueInParent(Long excludeId, Pantalla parent, int orden) {
        if (orden < 0) {
            throw new IllegalArgumentException("El orden no puede ser menor que cero.");
        }
        Long parentKey = parent != null ? parent.getId() : null;
        for (Pantalla other : pantallaRepository.findAll()) {
            if (excludeId != null && other.getId().equals(excludeId)) {
                continue;
            }
            Long op = other.getParent() != null ? other.getParent().getId() : null;
            if (Objects.equals(op, parentKey) && other.getOrden() == orden) {
                throw new IllegalArgumentException(
                        "Ya existe otra entrada con el mismo orden bajo este mismo padre.");
            }
        }
    }

    @Transactional
    public void delete(Long id) {
        if (!pantallaRepository.existsById(id)) {
            throw new IllegalArgumentException("Pantalla no encontrada");
        }
        if (pantallaRepository.countByParent_Id(id) > 0) {
            throw new IllegalArgumentException("No se puede eliminar: tiene menús o pantallas hijas.");
        }
        pantallaRepository.deleteById(id);
    }

    @Transactional
    public PantallaDto setRoles(Long pantallaId, Set<Long> roleIds) {
        Pantalla p = pantallaRepository.findById(pantallaId)
                .orElseThrow(() -> new IllegalArgumentException("Pantalla no encontrada"));
        Set<Role> next = new HashSet<>();
        for (Long rid : roleIds) {
            Role r = roleRepository.findById(rid)
                    .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado: " + rid));
            next.add(r);
        }
        p.setRoles(next);
        return PantallaDto.from(pantallaRepository.save(p));
    }

    public record PantallaDto(
            Long id,
            String codigo,
            String nombre,
            String descripcion,
            String ruta,
            TipoPantalla tipo,
            Long parentId,
            int orden,
            boolean activo,
            Set<RoleRef> roles) {
        static PantallaDto from(Pantalla p) {
            Set<RoleRef> rs = p.getRoles().stream()
                    .map(r -> new RoleRef(r.getId(), r.getName()))
                    .collect(Collectors.toSet());
            return new PantallaDto(
                    p.getId(),
                    p.getCodigo(),
                    p.getNombre(),
                    p.getDescripcion(),
                    p.getRuta(),
                    p.getTipo(),
                    p.getParent() != null ? p.getParent().getId() : null,
                    p.getOrden(),
                    p.isActivo(),
                    rs);
        }
    }

    public record RoleRef(Long id, String name) {}
}
