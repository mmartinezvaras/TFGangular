package com.example.demo.DTO;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sala")
public class Sala {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "cliente_id", nullable = false)
    private Integer clienteId;

    @Column(nullable = false, length = 20)
    private String codigo;

    @Column(name = "creada_en", insertable = false, updatable = false)
    private LocalDateTime creadaEn;

    // Getters y Setters
    public Integer getId() {
        return id;
    }

    public Integer getClienteId() {
        return clienteId;
    }

    public String getCodigo() {
        return codigo;
    }

    public LocalDateTime getCreadaEn() {
        return creadaEn;
    }
    public void setClienteId(Integer clienteId) {
        this.clienteId = clienteId;
    }
    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
    public void setCreadaEn(LocalDateTime creadaEn) {
        this.creadaEn = creadaEn;
    }
    public void setId(Integer id) {
        this.id = id;
    }

    
    public Sala() {
    }

    public Sala(Integer clienteId, String codigo) {
        this.clienteId = clienteId;
        this.codigo = codigo;
    }

    
}
