package com.example.demo.controlador;

import com.example.demo.DTO.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {
    // Buscar un producto exacto por nombre
    Item findByNombre(String nombre);

    // Listar todos los productos de una categoría (bebidas, postres, etc.)
    List<Item> findByCategoria(String categoria);

    // Buscar items que cuesten menos de un precio determinado
    List<Item> findByPrecioLessThan(Double precio);
}
