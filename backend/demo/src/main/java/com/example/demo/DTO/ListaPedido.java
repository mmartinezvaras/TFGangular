package com.example.demo.DTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "lista_pedido")
public class ListaPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "id_item")
    private Integer idItem;

    @Column(name = "cantidad")
    private Integer cantidad;

    @Column(name = "entregado")
    private boolean entregado;

    @Column(name = "id_pedido")
    private Integer idPedido;

    @Column(name = "id_persona")
    private Integer idPersona;

    public ListaPedido() {
    }

    public ListaPedido(Integer id, Integer idItem, Integer cantidad, boolean entregado, Integer idPedido, Integer idPersona) {
        this.id = id;
        this.idItem = idItem;
        this.cantidad = cantidad;
        this.entregado = entregado;
        this.idPedido = idPedido;
        this.idPersona = idPersona;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getIdItem() {
        return idItem;
    }

    public void setIdItem(Integer idItem) {
        this.idItem = idItem;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public boolean isEntregado() {
        return entregado;
    }

    public void setEntregado(boolean entregado) {
        this.entregado = entregado;
    }

    public Integer getIdPedido() {
        return idPedido;
    }

    public void setIdPedido(Integer idPedido) {
        this.idPedido = idPedido;
    }

    public Integer getIdPersona() {
        return idPersona;
    }

    public void setIdPersona(Integer idPersona) {
        this.idPersona = idPersona;
    }
}
