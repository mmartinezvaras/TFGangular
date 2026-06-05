package com.example.demo;

public class Mesa {
    long codigoMesa;
    String nombre;
    String productos;

    public Mesa(long codigoMesa, String nombre, String productos) {
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

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getProductos() {
        return productos;
    }

    public void setProductos(String productos) {
        this.productos = productos;
    }
}