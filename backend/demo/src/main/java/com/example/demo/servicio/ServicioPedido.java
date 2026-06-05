package com.example.demo.servicio;

import com.example.demo.DTO.ListaPedido;
import com.example.demo.DTO.Item;
import com.example.demo.DTO.Pedido;
import com.example.demo.controlador.ItemRepository;
import com.example.demo.controlador.ListaPedidoRepository;
import com.example.demo.controlador.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicioPedido {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ListaPedidoRepository listaPedidoRepository;

    @Autowired
    private ItemRepository itemRepository;

    public Pedido obtenerOCrearPedidoPendiente(Integer salaId) {
        return pedidoRepository.findFirstByIdSalaAndFinalizadoFalse(salaId)
                .orElseGet(() -> {
                    Pedido nuevoPedido = new Pedido();
                    nuevoPedido.setIdSala(salaId);
                    nuevoPedido.setFinalizado(false);
                    return pedidoRepository.save(nuevoPedido);
                });
    }

    public void agregarProductoAPedido(Integer pedidoId, Integer itemId, Integer cantidad, Integer personaId) {
        pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item no encontrado"));

        List<ListaPedido> lineasPendientes = listaPedidoRepository
                .findByIdPedidoAndIdItemAndEntregadoAndIdPersona(pedidoId, item.getId(), false, personaId);

        if (lineasPendientes.isEmpty()) {
            ListaPedido nuevaLinea = new ListaPedido();
            nuevaLinea.setIdItem(item.getId());
            nuevaLinea.setCantidad(cantidad);
            nuevaLinea.setEntregado(false);
            nuevaLinea.setIdPedido(pedidoId);
            nuevaLinea.setIdPersona(personaId);
            listaPedidoRepository.save(nuevaLinea);
            return;
        }

        ListaPedido lineaPrincipal = lineasPendientes.get(0);
        int cantidadTotal = cantidad;

        for (ListaPedido linea : lineasPendientes) {
            cantidadTotal += linea.getCantidad();
        }

        lineaPrincipal.setCantidad(cantidadTotal);
        listaPedidoRepository.save(lineaPrincipal);

        for (int i = 1; i < lineasPendientes.size(); i++) {
            listaPedidoRepository.deleteById(lineasPendientes.get(i).getId());
        }
    }

    public void actualizarCantidadPendiente(Integer pedidoId, Integer itemId, Integer personaId, Integer nuevaCantidad) {
        pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        List<ListaPedido> lineasPendientes = listaPedidoRepository
                .findByIdPedidoAndIdItemAndEntregadoAndIdPersona(pedidoId, itemId, false, personaId);

        if (lineasPendientes.isEmpty()) {
            throw new RuntimeException("Producto no encontrado en el pedido");
        }

        ListaPedido lineaPrincipal = lineasPendientes.get(0);
        lineaPrincipal.setCantidad(nuevaCantidad);
        listaPedidoRepository.save(lineaPrincipal);

        for (int i = 1; i < lineasPendientes.size(); i++) {
            listaPedidoRepository.deleteById(lineasPendientes.get(i).getId());
        }
    }

    public void entregarPedido(Integer pedidoId, Integer itemId, Integer personaId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        List<ListaPedido> lineasPendientes = listaPedidoRepository
                .findByIdPedidoAndIdItemAndEntregadoAndIdPersona(pedidoId, itemId, false, personaId);

        if (lineasPendientes.isEmpty()) {
            throw new RuntimeException("Producto no encontrado en el pedido");
        }

        for (ListaPedido linea : lineasPendientes) {
            linea.setEntregado(true);
            listaPedidoRepository.save(linea);
        }

        boolean quedanPendientes = listaPedidoRepository.findByIdPedido(pedido.getId())
                .stream()
                .anyMatch(lp -> !lp.isEntregado());

        if (!quedanPendientes) {
            pedido.setFinalizado(true);
            pedidoRepository.save(pedido);
        }
    }

    public void eliminarPedidoPendiente(Integer pedidoId, Integer itemId, Integer personaId) {
        pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        List<ListaPedido> lineasPendientes = listaPedidoRepository
                .findByIdPedidoAndIdItemAndEntregadoAndIdPersona(pedidoId, itemId, false, personaId);

        if (lineasPendientes.isEmpty()) {
            throw new RuntimeException("Producto no encontrado en el pedido");
        }

        for (ListaPedido linea : lineasPendientes) {
            listaPedidoRepository.deleteById(linea.getId());
        }

        boolean pedidoVacio = listaPedidoRepository.findByIdPedido(pedidoId).isEmpty();
        if (pedidoVacio) {
            pedidoRepository.deleteById(pedidoId);
        }
    }

    public Pedido crearPedido(Integer salaId) {
        return obtenerOCrearPedidoPendiente(salaId);
    }

    public Pedido finalizarPedido(Integer pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        List<ListaPedido> lineas = listaPedidoRepository.findByIdPedido(pedidoId);
        boolean quedanPendientes = lineas.stream()
                .anyMatch(lp -> !lp.isEntregado());

        if (quedanPendientes) {
            throw new RuntimeException("No se puede finalizar el pedido porque hay productos pendientes de entrega");
        }

        for (ListaPedido linea : lineas) {
            linea.setEntregado(true);
            listaPedidoRepository.save(linea);
        }

        pedido.setFinalizado(true);
        return pedidoRepository.save(pedido);
    }
}
