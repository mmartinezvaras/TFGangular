package com.example.demo.controlador;

import com.example.demo.DTO.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PersonaRepository extends JpaRepository<Persona, Integer> {
    // Buscar todas las personas que pertenecen a una sala (por el ID de la sala)
    // Nota: Asegúrate de tener el atributo 'sala' o 'salaId' en tu entidad Persona
    List<Persona> findByNombreContaining(String nombre);
}
