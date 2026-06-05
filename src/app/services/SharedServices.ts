import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SharedServices {
private data_codigo_sala = new BehaviorSubject<number>(0);
data_codigo_sala$ = this.data_codigo_sala.asObservable();

setDataIdSala(codigo_sala: number) {
  this.data_codigo_sala.next(codigo_sala);
}
private data_id_usuario = new BehaviorSubject<number>(0);
data_id_usuario$ = this.data_id_usuario.asObservable();

setDataUsuario(id_usuario: number) {
  this.data_id_usuario.next(id_usuario);
}

private data_nombre_usuario = new BehaviorSubject<string>('');
data_nombre_usuario$ = this.data_nombre_usuario.asObservable();

setDataNombreUsuario(nombre: string) {
  this.data_nombre_usuario.next(nombre);
}

private carritoActualizado = new Subject<void>();
carritoActualizado$ = this.carritoActualizado.asObservable();

notificarCarritoActualizado() {
  this.carritoActualizado.next();
}

private data_id_pedido = new BehaviorSubject<number>(0);
data_id_pedido$ = this.data_id_pedido.asObservable();

setDataIdPedido(id_pedido: number) {
  this.data_id_pedido.next(id_pedido);
}

}
