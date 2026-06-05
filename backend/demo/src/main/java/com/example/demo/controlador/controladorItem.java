package com.example.demo.controlador;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.example.demo.DTO.Item;
import com.example.demo.servicio.ServicioItem;

@RestController
@RequestMapping("/item")
@CrossOrigin(origins = "*")
public class controladorItem {

    private ServicioItem servicioItem;

    public controladorItem(ServicioItem servicioItem) {
        this.servicioItem = servicioItem;
    }

    @GetMapping
    public List<Item> getAll() {
        return servicioItem.getAll();
    }

    @GetMapping("/{id}")
    public Item getById(@PathVariable Integer id) {
        return servicioItem.getById(id)
                .orElseThrow(() -> new RuntimeException("Item no encontrado"));
    }

    @GetMapping("/nombre/{nombre}")
    public Item getByNombre(@PathVariable String nombre) {
        return servicioItem.getByNombre(nombre)
                .orElseThrow(() -> new RuntimeException("Item no encontrado"));
    }

    @GetMapping("/categoria/{categoria}")
    public List<Item> getByCategoria(@PathVariable String categoria) {
        return servicioItem.getByCategoria(categoria);
    }
}
