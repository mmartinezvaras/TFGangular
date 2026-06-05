package com.example.demo.controlador;

import com.example.demo.DTO.ListaPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListaPedidoRepository extends JpaRepository<ListaPedido, Integer> {

    List<ListaPedido> findByIdItem(Integer idItem);

    List<ListaPedido> findByEntregado(boolean entregado);

    List<ListaPedido> findByIdPedido(Integer idPedido);

    Optional<ListaPedido> findByIdPedidoAndIdItem(Integer idPedido, Integer idItem);

    List<ListaPedido> findByIdPedidoAndIdItemAndEntregado(Integer idPedido, Integer idItem, boolean entregado);

    List<ListaPedido> findByIdPedidoAndIdItemAndEntregadoAndIdPersona(
            Integer idPedido,
            Integer idItem,
            boolean entregado,
            Integer idPersona
    );

    void deleteByIdItemAndEntregadoFalse(Integer idItem);
}
