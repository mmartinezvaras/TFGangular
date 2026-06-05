import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FacturaPago, LineaFacturaPago, PagoService } from '../services/PagoService';
import { ApiUrlService } from '../services/ApiUrlService';

@Component({
  selector: 'app-validar-pedido',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  templateUrl: './validar-pedido.html',
  styleUrl: './validar-pedido.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidarPedidoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly pagoService = inject(PagoService);
  private readonly apiUrl = inject(ApiUrlService);

  readonly factura = signal<FacturaPago | null>(null);
  readonly estado = signal<'cargando' | 'finalizado' | 'error'>('cargando');
  readonly mensaje = signal('Validando pedido...');

  constructor() {
    const codigo = this.route.snapshot.paramMap.get('codigo') ?? '';
    const payload = this.route.snapshot.queryParamMap.get('data') ?? '';
    const factura = payload
      ? this.pagoService.decodificarFacturaDesdeQr(payload)
      : this.pagoService.getFactura(codigo);

    this.factura.set(factura);

    if (!factura) {
      this.estado.set('error');
      this.mensaje.set('No se ha podido leer la factura del QR.');
      return;
    }

    this.finalizarPedido(factura);
  }

  trackByLinea(_: number, linea: LineaFacturaPago) {
    return `${linea.idPersona}-${linea.idItem}-${linea.producto}`;
  }

  private finalizarPedido(factura: FacturaPago) {
    const url = this.apiUrl.url(`/pedidos/finalizar/${factura.pedidoId}`);

    this.http.put(url, {}).subscribe({
      next: () => {
        this.estado.set('finalizado');
        this.mensaje.set('Sesión finalizada correctamente.');
      },
      error: () => {
        this.estado.set('error');
        this.mensaje.set('El QR se ha leído, pero no se pudo finalizar el pedido en el backend.');
      }
    });
  }

}
