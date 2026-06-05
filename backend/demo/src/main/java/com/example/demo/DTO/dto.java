package com.example.demo.DTO;



public class dto {

    private long codigoMesa;
    private String nombre;
    private String productos;

    

    public dto(long codigoMesa, String nombre, String productos) {
        this.codigoMesa = codigoMesa;
        this.nombre = nombre;
        this.productos = productos;
    }
    public long getCodigoMesa() {
        return codigoMesa;
    }

    public void setCodigoMesa(long codigoMesa) {
        this.codigoMesa = codigoMesa;
    }

    public String getNombre() {
        return nombre;
    }
    public String getProductos(){
        return productos;
    }
    public void setProductos(String productos){
        this.productos = productos;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
