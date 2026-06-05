package com.example.demo.DTO;

import java.io.Serializable;
import java.util.Objects;

public class PedidoId implements Serializable {
    private Integer idSala;
    private Integer idListaPedido;

    public PedidoId() {
    }

    public PedidoId(Integer idSala, Integer idListaPedido) {
        this.idSala = idSala;
        this.idListaPedido = idListaPedido;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PedidoId that = (PedidoId) o;
        return Objects.equals(idSala, that.idSala) &&
                Objects.equals(idListaPedido, that.idListaPedido);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idSala, idListaPedido);
    }

    public Integer getIdSala() {
        return idSala;
    }

    public void setIdSala(Integer idSala) {
        this.idSala = idSala;
    }

    public Integer getIdListaPedido() {
        return idListaPedido;
    }

    public void setIdListaPedido(Integer idListaPedido) {
        this.idListaPedido = idListaPedido;
    }
}
