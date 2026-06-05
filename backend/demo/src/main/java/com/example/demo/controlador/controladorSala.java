package com.example.demo.controlador;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.http.ResponseEntity;
import com.example.demo.servicio.ServicioSala;
import com.example.demo.DTO.Sala;


@RestController
@RequestMapping("/sala")
@CrossOrigin(origins = "*")
public class controladorSala {

    private ServicioSala servicioSala; //el lugar dnd estan almacenados los servicios autenticos

    public controladorSala(ServicioSala servicioSala) {
        this.servicioSala = servicioSala;
    }

    
    @GetMapping
    public List<com.example.demo.DTO.Sala> getAll() { //este sirve para obtener la lista de DTOs
        return servicioSala.getAll();}       // y luegos se usan para llamarlos en Angular

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<Sala> getByCodigo(@PathVariable String codigo) {
        return servicioSala.getByCodigo(codigo)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
         
    @PostMapping
    public Sala add(@RequestBody com.example.demo.DTO.Sala dto) { //este sirve para añadir un DTO a la lista de DTOs
      return servicioSala.add(dto);   
     }
    
}
