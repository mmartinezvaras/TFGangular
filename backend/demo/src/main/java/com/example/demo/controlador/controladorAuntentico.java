package com.example.demo.controlador;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.example.demo.servicio.ServiciosAutenticos;

@RestController
@RequestMapping("/autenticos")
@CrossOrigin(origins = "*")
public class controladorAuntentico {
    
    private ServiciosAutenticos serviciosAutenticos; //el lugar dnd estan almacenados los servicios autenticos

    public controladorAuntentico(ServiciosAutenticos serviciosAutenticos) {
        this.serviciosAutenticos = serviciosAutenticos;
    }

    
    @GetMapping
    public List<com.example.demo.DTO.dto> getAll() { //este sirve para obtener la lista de DTOs
        return serviciosAutenticos.getAll();}       // y luegos se usan para llamarlos en Angular
         
    @PostMapping
    public void add(@RequestBody com.example.demo.DTO.dto dto) { //este sirve para añadir un DTO a la lista de DTOs
        serviciosAutenticos.add(dto);   }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id) { //este sirve para eliminar un DTO de la lista de DTOs
        serviciosAutenticos.delete(id);  }

    @PutMapping("/{id}")
    public void update(@PathVariable long id, @RequestBody com.example.demo.DTO.dto dto) { //este sirve para actualizar un DTO de la lista de DTOs
        serviciosAutenticos.update(id, dto);  }

}
