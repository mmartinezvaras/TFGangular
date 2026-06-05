package com.example.demo.servicio;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.demo.DTO.dto;

@Service
public class ServiciosAutenticos {
    
 private final List<dto> ListaDTO = new ArrayList<>();

    public List<dto> getAll() { //esto sirve para obtener la lista de DTOs
        return ListaDTO;
    }

    public void add(dto dto) {//este sirve para añadir un DTO a la lista de DTOs 
                              // y para que si eliminas uno no salte al siguiente
    long nuevoIdMesa = 1;

    while (true) {
        boolean existe = false;

        for (dto d : ListaDTO) {
            if (d.getCodigoMesa() == nuevoIdMesa) {
                existe = true;
                break;
            }
        }

        if (!existe) {
            break;
        }

        nuevoIdMesa++;
    }

    dto.setCodigoMesa(nuevoIdMesa);
    ListaDTO.add(dto);
}

    public boolean delete(long id) { //este sirve para eliminar un DTO de la lista de DTOs
        return ListaDTO.removeIf(dto -> dto.getCodigoMesa() == id); //elemina el DTO que tenga el mismo id que se le pase
    }
    public void update(long id, dto dto) { //este sirve para actualizar un DTO de la lista de DTOs
        for (int i = 0; i < ListaDTO.size(); i++) {
            if (ListaDTO.get(i).getCodigoMesa() == id) { //si el id del DTO que se le pase es igual al id del DTO que se encuentra en la lista de DTOs
                ListaDTO.set(i, dto); //actualiza el DTO que se encuentra en la lista de DTOs con el DTO que se le pase
                return;
            }
        }
    }

}
