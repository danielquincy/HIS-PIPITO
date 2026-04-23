package org.lospipitos.his.patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.lospipitos.his.catalog.Catalogo;
import org.lospipitos.his.catalog.TipoCatalogo;
import org.lospipitos.his.iam.AppUser;

import java.time.Instant;

@Entity
@Table(name = "documento_paciente")
public class DocumentoPaciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_catalogo_id")
    private TipoCatalogo tipoCatalogo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_documento_catalogo_id")
    private Catalogo tipoDocumento;

    @Column(name = "nombre_archivo", nullable = false)
    private String nombreArchivo;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "ruta_storage", nullable = false)
    private String rutaStorage;

    @Column(name = "tamano_bytes")
    private Long tamanoBytes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_subida_id")
    private AppUser usuarioSubida;

    public Long getId() {
        return id;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public void setPaciente(Paciente paciente) {
        this.paciente = paciente;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public String getRutaStorage() {
        return rutaStorage;
    }

    public void setRutaStorage(String rutaStorage) {
        this.rutaStorage = rutaStorage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Catalogo getTipoDocumento() {
        return tipoDocumento;
    }

    public void setTipoDocumento(Catalogo tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public Long getTamanoBytes() {
        return tamanoBytes;
    }

    public void setTamanoBytes(Long tamanoBytes) {
        this.tamanoBytes = tamanoBytes;
    }

    public void setUsuarioSubida(AppUser usuarioSubida) {
        this.usuarioSubida = usuarioSubida;
    }

    public void setTipoCatalogo(TipoCatalogo tipoCatalogo) {
        this.tipoCatalogo = tipoCatalogo;
    }
}
