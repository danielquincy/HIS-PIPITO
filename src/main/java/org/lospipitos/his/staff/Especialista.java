package org.lospipitos.his.staff;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;
import org.lospipitos.his.catalog.Catalogo;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "especialista")
public class Especialista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false, unique = true)
    private Staff staff;

    @Column(nullable = false)
    private boolean activo = true;

    @ManyToMany
    @JoinTable(
            name = "especialista_especialidad",
            joinColumns = @JoinColumn(name = "especialista_id"),
            inverseJoinColumns = @JoinColumn(name = "catalogo_id")
    )
    @BatchSize(size = 32)
    private Set<Catalogo> especialidades = new HashSet<>();

    public Long getId() {
        return id;
    }

    public Staff getStaff() {
        return staff;
    }

    public void setStaff(Staff staff) {
        this.staff = staff;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public Set<Catalogo> getEspecialidades() {
        return especialidades;
    }

    public void setEspecialidades(Set<Catalogo> especialidades) {
        this.especialidades = especialidades;
    }
}
