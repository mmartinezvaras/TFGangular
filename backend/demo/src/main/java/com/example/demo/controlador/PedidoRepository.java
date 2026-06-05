package com.example.demo.controlador;

import com.example.demo.DTO.Pedido;
import com.example.demo.DTO.ListaPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    @Query("""
        SELECT lp
        FROM ListaPedido lp
        JOIN Pedido p ON lp.idPedido = p.id
        WHERE p.idSala = :salaId
          AND p.finalizado = false
        """)
    List<ListaPedido> findListaPedidosBySalaId(@Param("salaId") Integer salaId);

    List<Pedido> findByIdSala(Integer idSala);

    Optional<Pedido> findFirstByIdSalaAndFinalizadoFalse(Integer idSala);

    
    Optional<Pedido> findById(Integer id);

    List<Pedido> findByFinalizado(boolean finalizado);

    @Query(value = """
        SELECT SUM(lp.cantidad * i.precio)
        FROM pedido p
        JOIN lista_pedido lp ON lp.id_pedido = p.id
        JOIN item i ON lp.id_item = i.id
        WHERE p.id_sala = :salaId
          AND lp.entregado = true
        """, nativeQuery = true)
    BigDecimal calcularTotalConsumoSala(@Param("salaId") Integer salaId);

@Query("""
        SELECT lp
        FROM ListaPedido lp
        WHERE lp.idPedido = :pedidoId
        """)
    List<ListaPedido> findListaPedidosByPedidoId(@Param("pedidoId") Integer pedidoId);
}
