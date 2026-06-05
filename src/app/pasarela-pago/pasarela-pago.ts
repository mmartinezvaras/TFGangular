import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { firstValueFrom } from 'rxjs';
import { FacturaPdfService } from '../services/FacturaPdfService';
import { FacturaPago, PagoService } from '../services/PagoService';
import { ApiUrlService } from '../services/ApiUrlService';

interface LineaPedidoEstado {
  entregado: boolean;
}

@Component({
  selector: 'app-pasarela-pago',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  templateUrl: './pasarela-pago.html',
  styleUrl: './pasarela-pago.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasarelaPagoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly pagoService = inject(PagoService);
  private readonly facturaPdfService = inject(FacturaPdfService);
  private readonly apiUrl = inject(ApiUrlService);

  readonly factura = signal<FacturaPago | null>(null);
  readonly pagado = signal(false);
  readonly comprobandoPago = signal(false);
  readonly avisoPago = signal('');

  constructor() {
    const codigo = this.route.snapshot.paramMap.get('codigo') ?? '';
    this.factura.set(this.pagoService.getFactura(codigo));
  }

  async confirmarPago() {
    const factura = this.factura();

    if (!factura || this.comprobandoPago()) {
      return;
    }

    this.comprobandoPago.set(true);
    this.avisoPago.set('');

    try {
      const lineas = await firstValueFrom(
        this.http.get<LineaPedidoEstado[]>(this.apiUrl.url(`/pedidos/${factura.pedidoId}`))
      );

      if (lineas.some((linea) => !linea.entregado)) {
        this.avisoPago.set('No se puede confirmar el pago porque el pedido tiene productos pendientes de entrega.');
        return;
      }

      this.pagado.set(true);
    } catch (error) {
      console.error('Error al comprobar el pedido antes de pagar', error);
      this.avisoPago.set('No se pudo comprobar el estado del pedido. Inténtalo de nuevo antes de pagar.');
    } finally {
      this.comprobandoPago.set(false);
    }
  }

  descargarFactura(factura: FacturaPago) {
    this.facturaPdfService.descargarFactura(factura);
  }
}
