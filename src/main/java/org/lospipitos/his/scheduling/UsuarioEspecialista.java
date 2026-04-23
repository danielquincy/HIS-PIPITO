package org.lospipitos.his.scheduling;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.lospipitos.his.iam.AppUser;
import org.lospipitos.his.staff.Especialista;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "usuario_especialista")
@IdClass(UsuarioEspecialista.UsuarioEspecialistaId.class)
public class UsuarioEspecialista {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "especialista_id")
    private Long especialistaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especialista_id", insertable = false, updatable = false)
    private Especialista especialista;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getEspecialistaId() {
        return especialistaId;
    }

    public void setEspecialistaId(Long especialistaId) {
        this.especialistaId = especialistaId;
    }

    public static class UsuarioEspecialistaId implements Serializable {
        private Long userId;
        private Long especialistaId;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public Long getEspecialistaId() {
            return especialistaId;
        }

        public void setEspecialistaId(Long especialistaId) {
            this.especialistaId = especialistaId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            UsuarioEspecialistaId that = (UsuarioEspecialistaId) o;
            return Objects.equals(userId, that.userId) && Objects.equals(especialistaId, that.especialistaId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, especialistaId);
        }
    }
}
