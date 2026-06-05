package com.example.demo.servicio;

import com.example.demo.controlador.SalaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.DTO.Sala;
import java.util.List;
import java.util.Optional;

@Service
public class ServicioSala {

    @Autowired
    private SalaRepository salaRepository;

    public List<com.example.demo.DTO.Sala> getAll() {
        return salaRepository.findAll().stream()
                .map(sala -> new com.example.demo.DTO.Sala(sala.getClienteId(), sala.getCodigo()))
                .toList();
    }

    public Sala add(com.example.demo.DTO.Sala dto) {
        Sala sala = new Sala();
        sala.setCodigo(dto.getCodigo());
        sala.setClienteId(dto.getClienteId());
        salaRepository.save(sala);
        return sala;
    }

    public Optional<Sala> getByCodigo(String codigo) {
        return salaRepository.findByCodigo(codigo);
    }

}
