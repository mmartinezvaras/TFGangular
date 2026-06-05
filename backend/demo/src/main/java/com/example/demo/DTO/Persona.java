package com.example.demo.DTO;

import jakarta.persistence.*; // Si usas Spring Boot 3+ (lo más probable)
import java.time.LocalDateTime;

@Entity
@Table(name = "persona")
public class Persona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 60)
    private String nombre;

    @Column(name = "creada_en", insertable = false, updatable = false)
    private LocalDateTime creadaEn;

    // Getters y Setters
    public Integer getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public LocalDateTime getCreadaEn() {
        return creadaEn;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setCreadaEn(LocalDateTime creadaEn) {
        this.creadaEn = creadaEn;
    }

    // Constructor vacío (requerido por JPA)
    public Persona() {
    }

    // Constructor con parámetros (opcional, para facilitar la creación de objetos)
    public Persona( String nombre) {
        this.nombre = nombre;
    }

}
