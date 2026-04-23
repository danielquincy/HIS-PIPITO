package org.lospipitos.his.patient;

import org.lospipitos.his.HisProperties;
import org.lospipitos.his.catalog.Catalogo;
import org.lospipitos.his.catalog.CatalogoRepository;
import org.lospipitos.his.catalog.TipoCatalogo;
import org.lospipitos.his.catalog.TipoCatalogoRepository;
import org.lospipitos.his.iam.AppUser;
import org.lospipitos.his.iam.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PatientService {

    private final PacienteRepository pacienteRepository;
    private final DocumentoPacienteRepository documentoPacienteRepository;
    private final CatalogoRepository catalogoRepository;
    private final TipoCatalogoRepository tipoCatalogoRepository;
    private final UserRepository userRepository;
    private final HisProperties hisProperties;

    public PatientService(
            PacienteRepository pacienteRepository,
            DocumentoPacienteRepository documentoPacienteRepository,
            CatalogoRepository catalogoRepository,
            TipoCatalogoRepository tipoCatalogoRepository,
            UserRepository userRepository,
            HisProperties hisProperties) {
        this.pacienteRepository = pacienteRepository;
        this.documentoPacienteRepository = documentoPacienteRepository;
        this.catalogoRepository = catalogoRepository;
        this.tipoCatalogoRepository = tipoCatalogoRepository;
        this.userRepository = userRepository;
        this.hisProperties = hisProperties;
    }

    @Transactional(readOnly = true)
    public List<PacienteResponse> list() {
        return pacienteRepository.findAll().stream().map(PacienteResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PacienteResponse> searchPage(String q, int page, int size) {
        String t = q == null ? "" : q.trim();
        if (t.isEmpty() || t.length() > 200) {
            return Page.empty(PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100)));
        }
        return pacienteRepository
                .searchByText(
                        t, PageRequest.of(page, Math.min(Math.max(1, size), 100), Sort.by("apellidos", "nombres")))
                .map(PacienteResponse::from);
    }

    @Transactional(readOnly = true)
    public PacienteResponse get(Long id) {
        return pacienteRepository.findById(id).map(PacienteResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
    }

    @Transactional
    public PacienteResponse create(CreatePacienteRequest req) {
        String expediente = req.numeroExpediente().trim();
        if (pacienteRepository.findByNumeroExpediente(expediente).isPresent()) {
            throw new IllegalArgumentException("Número de expediente ya existe");
        }
        Paciente p = new Paciente();
        p.setNombres(req.nombres().trim());
        p.setApellidos(req.apellidos().trim());
        p.setNumeroExpediente(expediente);
        p.setFechaNacimiento(req.fechaNacimiento());
        p.setTelefono(req.telefono().trim());
        p.setNotas(req.notas().trim());
        p.setCapacidadesInfo(req.capacidadesInfo().trim());
        p.setDireccion(req.direccion().trim());
        p.setSexo(req.sexo().trim());
        p.setResponsableTutor(req.responsableTutor().trim());
        p.setDiagnosticoReferencia(req.diagnosticoReferencia().trim());
        p.setActivo(true);
        return PacienteResponse.from(pacienteRepository.save(p));
    }

    @Transactional
    public PacienteResponse update(Long id, UpdatePacienteRequest req) {
        Paciente p = pacienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        String expediente = req.numeroExpediente().trim();
        if (!expediente.equalsIgnoreCase(p.getNumeroExpediente())
                && pacienteRepository.findByNumeroExpediente(expediente).isPresent()) {
            throw new IllegalArgumentException("Número de expediente ya existe");
        }
        p.setNombres(req.nombres().trim());
        p.setApellidos(req.apellidos().trim());
        p.setNumeroExpediente(expediente);
        p.setFechaNacimiento(req.fechaNacimiento());
        p.setTelefono(req.telefono().trim());
        p.setNotas(req.notas().trim());
        p.setCapacidadesInfo(req.capacidadesInfo().trim());
        p.setDireccion(req.direccion().trim());
        p.setSexo(req.sexo().trim());
        p.setResponsableTutor(req.responsableTutor().trim());
        p.setDiagnosticoReferencia(req.diagnosticoReferencia().trim());
        p.setActivo(req.activo());
        return PacienteResponse.from(pacienteRepository.save(p));
    }

    @Transactional(readOnly = true)
    public List<DocumentoResponse> listDocuments(Long pacienteId) {
        pacienteRepository.findById(pacienteId).orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        return documentoPacienteRepository.findByPacienteIdOrderByCreatedAtDesc(pacienteId).stream()
                .map(DocumentoResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentoResponse storeDocument(Long pacienteId, Long tipoDocumentoCatalogoId, MultipartFile file, String username)
            throws IOException {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
        Catalogo tipoDoc = catalogoRepository.findById(tipoDocumentoCatalogoId)
                .orElseThrow(() -> new IllegalArgumentException("Tipo de documento no válido"));
        TipoCatalogo tipoDocTipo = tipoCatalogoRepository.findByCodigo("DOCUMENTO_TIPO")
                .orElseThrow(() -> new IllegalStateException("Catálogo DOCUMENTO_TIPO no configurado"));
        if (!tipoDoc.getTipoCatalogo().getId().equals(tipoDocTipo.getId())) {
            throw new IllegalArgumentException("El catálogo indicado no es un tipo de documento");
        }
        Path base = Paths.get(hisProperties.storagePath()).toAbsolutePath().normalize();
        Path dir = base.resolve("pacientes").resolve(pacienteId.toString());
        Files.createDirectories(dir);
        String safeName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "archivo";
        String stored = UUID.randomUUID() + "_" + safeName.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path target = dir.resolve(stored);
        file.transferTo(target);

        DocumentoPaciente d = new DocumentoPaciente();
        d.setPaciente(paciente);
        d.setTipoCatalogo(tipoDocTipo);
        d.setTipoDocumento(tipoDoc);
        d.setNombreArchivo(safeName);
        d.setMimeType(file.getContentType());
        d.setRutaStorage(target.toString());
        d.setTamanoBytes(file.getSize());
        userRepository.findByUsername(username).ifPresent(d::setUsuarioSubida);
        return DocumentoResponse.from(documentoPacienteRepository.save(d));
    }

    @Transactional(readOnly = true)
    public DocumentDownload prepareDownload(Long pacienteId, Long documentoId) throws IOException {
        DocumentoPaciente d = documentoPacienteRepository.findById(documentoId)
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado"));
        if (!d.getPaciente().getId().equals(pacienteId)) {
            throw new IllegalArgumentException("Documento no pertenece al paciente");
        }
        Path p = Paths.get(d.getRutaStorage());
        if (!Files.exists(p)) {
            throw new IllegalStateException("Archivo no encontrado en almacenamiento");
        }
        Resource resource = new UrlResource(p.toUri());
        String mime = d.getMimeType() != null ? d.getMimeType() : "application/octet-stream";
        return new DocumentDownload(resource, d.getNombreArchivo(), mime);
    }

    public record DocumentDownload(Resource resource, String filename, String mimeType) {}

    public record CreatePacienteRequest(
            @NotBlank String nombres,
            @NotBlank String apellidos,
            @NotBlank String numeroExpediente,
            @NotNull java.time.LocalDate fechaNacimiento,
            @NotBlank @Pattern(regexp = "^\\d{8}$", message = "El teléfono debe contener exactamente 8 dígitos") String telefono,
            @NotBlank String notas,
            @NotBlank String capacidadesInfo,
            @NotBlank String direccion,
            @NotBlank String sexo,
            @NotBlank String responsableTutor,
            @NotBlank String diagnosticoReferencia
    ) {}

    public record UpdatePacienteRequest(
            @NotBlank String nombres,
            @NotBlank String apellidos,
            @NotBlank String numeroExpediente,
            @NotNull java.time.LocalDate fechaNacimiento,
            @NotBlank @Pattern(regexp = "^\\d{8}$", message = "El teléfono debe contener exactamente 8 dígitos") String telefono,
            @NotBlank String notas,
            @NotBlank String capacidadesInfo,
            @NotBlank String direccion,
            @NotBlank String sexo,
            @NotBlank String responsableTutor,
            @NotBlank String diagnosticoReferencia,
            boolean activo
    ) {}

    public record PacienteResponse(
            Long id,
            String nombres,
            String apellidos,
            String numeroExpediente,
            java.time.LocalDate fechaNacimiento,
            String telefono,
            String notas,
            String capacidadesInfo,
            String direccion,
            String sexo,
            String responsableTutor,
            String diagnosticoReferencia,
            boolean activo
    ) {
        static PacienteResponse from(Paciente p) {
            return new PacienteResponse(
                    p.getId(),
                    p.getNombres(),
                    p.getApellidos(),
                    p.getNumeroExpediente(),
                    p.getFechaNacimiento(),
                    p.getTelefono(),
                    p.getNotas(),
                    p.getCapacidadesInfo(),
                    p.getDireccion(),
                    p.getSexo(),
                    p.getResponsableTutor(),
                    p.getDiagnosticoReferencia(),
                    p.isActivo());
        }
    }

    public record DocumentoResponse(
            Long id,
            String nombreArchivo,
            String mimeType,
            Long tamanoBytes,
            java.time.Instant createdAt,
            Long tipoDocumentoCatalogoId,
            String tipoDocumentoNombre
    ) {
        static DocumentoResponse from(DocumentoPaciente d) {
            return new DocumentoResponse(
                    d.getId(),
                    d.getNombreArchivo(),
                    d.getMimeType(),
                    d.getTamanoBytes(),
                    d.getCreatedAt(),
                    d.getTipoDocumento() != null ? d.getTipoDocumento().getId() : null,
                    d.getTipoDocumento() != null ? d.getTipoDocumento().getNombre() : null);
        }
    }
}
