package com.example.demo.servicio;

import com.example.demo.DTO.Item;
import com.example.demo.controlador.ItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ServicioItem {

    private final ItemRepository itemRepository;

    public ServicioItem(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public List<Item> getAll() {
        return itemRepository.findAll();
    }

    public Optional<Item> getById(Integer id) {
        return itemRepository.findById(id);
    }

    public Optional<Item> getByNombre(String nombre) {
        return Optional.ofNullable(itemRepository.findByNombre(nombre));
    }

    public List<Item> getByCategoria(String categoria) {
        return itemRepository.findByCategoria(categoria);
    }
}
