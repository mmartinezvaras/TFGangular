package com.example.demo.controlador;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.example.demo.servicio.ServicioPedido;
import com.example.demo.DTO.Item;
import com.example.demo.DTO.Pedido;
import com.example.demo.DTO.ListaPedido;

@RestController
@RequestMapping("/pedidos")
@CrossOrigin(origins = "*")
public class controladorPedido {

    @Autowired
    private ItemRepository itemRepository;
    @Autowired
    private PedidoRepository pedidoRepository;
    @Autowired
    private SalaRepository salaRepository;
    @Autowired
    private ListaPedidoRepository listaPedidoRepository;
    @Autowired
    private ServicioPedido servicioPedido;

    public controladorPedido() {
    }

    @GetMapping("/{pedidoId}")
    public List<ListaPedido> obtenerPedidos(@PathVariable int pedidoId) {
        return pedidoRepository.findListaPedidosByPedidoId(pedidoId);
    }

    @PostMapping("/{pedidoId}/{itemId}/{cantidad}/{personaId}")
    public ResponseEntity<?> addPedido(
            @PathVariable Integer pedidoId,
            @PathVariable Integer itemId,
            @PathVariable Integer cantidad,
            @PathVariable Integer personaId) {
        try {
            servicioPedido.agregarProductoAPedido(pedidoId, itemId, cantidad, personaId);
            return ResponseEntity.ok("{\"mensaje\":\"Producto añadido correctamente\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/{pedidoId}/{item_id}/{personaId}")
    public ResponseEntity<?> eliminarProductos(@PathVariable int pedidoId, @PathVariable int item_id, @PathVariable Integer personaId) {
        try {
            servicioPedido.eliminarPedidoPendiente(pedidoId, item_id, personaId);
            return ResponseEntity.ok("{\"mensaje\":\"Producto eliminado correctamente\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @PatchMapping("/actualizar-cantidad/{pedidoId}/{itemId}/{personaId}")
    public ResponseEntity<?> actualizarCantidad(
            @PathVariable Integer pedidoId,
            @PathVariable Integer itemId,
            @PathVariable Integer personaId,
            @RequestBody Integer nuevaCantidad) {
        try {
            servicioPedido.actualizarCantidadPendiente(pedidoId, itemId, personaId, nuevaCantidad);
            return ResponseEntity.ok("{\"mensaje\": \"Cantidad actualizada con éxito\"}");
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/entregar/{pedidoId}/{itemId}/{personaId}")
    public ResponseEntity<?> entregar(@PathVariable Integer pedidoId, @PathVariable Integer itemId, @PathVariable Integer personaId) {
        try {
            servicioPedido.entregarPedido(pedidoId, itemId, personaId);
            return ResponseEntity.ok().body("{\"mensaje\":\"Pedido servido y actualizado correctamente\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/crear-pedido/{salaId}")
    public ResponseEntity<?> crearPedido(@PathVariable Integer salaId) {
        try {
            Pedido pedidoCreado = servicioPedido.crearPedido(salaId);
            return ResponseEntity.ok(pedidoCreado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/finalizar/{pedidoId}")
    public ResponseEntity<?> finalizarPedido(@PathVariable Integer pedidoId) {
        try {
            Pedido pedidoFinalizado = servicioPedido.finalizarPedido(pedidoId);
            return ResponseEntity.ok(pedidoFinalizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
