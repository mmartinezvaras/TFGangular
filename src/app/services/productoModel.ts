export class Pedido {

    id_sala: number;
    id_lista_pedido: number;
    finalizado: boolean;

    constructor(id_sala: number, id_lista_pedido: number, finalizado: boolean) {
        this.id_sala = id_sala;
        this.id_lista_pedido = id_lista_pedido;
        this.finalizado = finalizado;
    }

}

export class listaPedidos {
    id: number;
    id_item: number;
    cantidad: number;
    entregado: boolean;
    orden_pedido: number;

    constructor(id: number, id_item: number, cantidad: number, entregado: boolean, orden_pedido: number) {
        this.id = id;
        this.id_item = id_item;
        this.cantidad = cantidad;
        this.entregado = entregado;
        this.orden_pedido = orden_pedido;
    }

}