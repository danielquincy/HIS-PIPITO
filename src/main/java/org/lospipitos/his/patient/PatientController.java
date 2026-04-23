package org.lospipitos.his.patient;

import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
@PreAuthorize("isAuthenticated()")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public List<PatientService.PacienteResponse> list() {
        return patientService.list();
    }

    @GetMapping("/search")
    public Page<PatientService.PacienteResponse> search(
            @RequestParam("q") String q,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return patientService.searchPage(q, page, size);
    }

    @GetMapping("/{id}")
    public PatientService.PacienteResponse get(@PathVariable Long id) {
        return patientService.get(id);
    }

    @PostMapping
    public PatientService.PacienteResponse create(@Valid @RequestBody PatientService.CreatePacienteRequest body) {
        return patientService.create(body);
    }

    @PatchMapping("/{id}")
    public PatientService.PacienteResponse update(@PathVariable Long id, @Valid @RequestBody PatientService.UpdatePacienteRequest body) {
        return patientService.update(id, body);
    }

    @GetMapping("/{id}/documents")
    public List<PatientService.DocumentoResponse> listDocs(@PathVariable Long id) {
        return patientService.listDocuments(id);
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PatientService.DocumentoResponse upload(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestParam("tipoDocumentoCatalogoId") Long tipoDocumentoCatalogoId,
            @AuthenticationPrincipal Jwt jwt) throws IOException {
        String user = jwt.getSubject();
        return patientService.storeDocument(id, tipoDocumentoCatalogoId, file, user);
    }

    @GetMapping("/{pacienteId}/documents/{docId}/file")
    public ResponseEntity<Resource> download(@PathVariable Long pacienteId, @PathVariable Long docId) throws IOException {
        PatientService.DocumentDownload d = patientService.prepareDownload(pacienteId, docId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + d.filename().replace("\"", "") + "\"")
                .contentType(MediaType.parseMediaType(d.mimeType()))
                .body(d.resource());
    }
}
