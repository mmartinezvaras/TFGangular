package com.example.demo.controlador;
import com.example.demo.DTO.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Integer> {
    // Buscar una sala por su código (ej: 'A7K3')
    Optional<Sala> findByCodigo(String codigo);

    // Listar salas de un cliente específico
    java.util.List<Sala> findByClienteId(Integer clienteId);
}