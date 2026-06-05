package com.example.demo.controlador;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.example.demo.servicio.ServivioLogin;

@RestController
@RequestMapping("/login")
@CrossOrigin(origins = "*")
public class controladorPersona {
            
    private ServivioLogin servivioLogin; //el lugar dnd estan almacenados los servicios autenticos

    public controladorPersona(ServivioLogin servivioLogin) {
        this.servivioLogin = servivioLogin;
    }

    @GetMapping
    public List<com.example.demo.DTO.Persona> getAll() { //este sirve para obtener la lista de DTOs
        return servivioLogin.getAll();}       // y luegos se usan para llamarlos en Angular

    @GetMapping("/{id}")
    public com.example.demo.DTO.Persona getById(@PathVariable Integer id) {
        return servivioLogin.getById(id);
    }
         
    @PostMapping
    public com.example.demo.DTO.Persona add(@RequestBody com.example.demo.DTO.Persona dto) { //este sirve para añadir un DTO a la lista de DTOs
    return servivioLogin.add(dto); 
         
     }

     
     

}
