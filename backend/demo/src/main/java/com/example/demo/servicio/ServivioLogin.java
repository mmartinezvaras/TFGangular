package com.example.demo.servicio;
import com.example.demo.controlador.PersonaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.DTO.Persona;
import java.util.List;

@Service
public class ServivioLogin {
    @Autowired
    private PersonaRepository personaRepository;

    public List<com.example.demo.DTO.Persona> getAll() {
        return personaRepository.findAll();
    }

    public Persona getById(Integer id) {
        return personaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada"));
    }

    public Persona add(com.example.demo.DTO.Persona dto) {
        Persona persona = new Persona();
        persona.setNombre(dto.getNombre());
        personaRepository.save(persona);
        return persona;
    }
}
