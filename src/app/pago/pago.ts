import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import * as QRCode from 'qrcode';
import { FacturaPdfService } from '../services/FacturaPdfService';
import { FacturaPago, LineaFacturaPago, PagoService, PersonaFacturaPago } from '../services/PagoService';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pagoService = inject(PagoService);
  private readonly facturaPdfService = inject(FacturaPdfService);

  readonly factura = signal<FacturaPago | null>(null);
  readonly qrImagen = signal('');
  readonly pdfUrl = signal('');
  readonly urlValidacion = signal('');

  constructor() {
    const codigo = this.route.snapshot.paramMap.get('codigo') ?? '';
    const factura = this.pagoService.getFactura(codigo);
    this.factura.set(factura);

    if (factura) {
      void this.prepararFacturaPdf(factura);
    } else if (codigo) {
      // Intentar obtener la factura del servidor (para acceso externo)
      void this.cargarFacturaRemota(codigo);
    }
  }

  /**
   * Carga una factura desde el servidor para acceso externo
   */
  private async cargarFacturaRemota(codigo: string) {
    const factura = await this.pagoService.getFacturaRemota(codigo);
    if (factura) {
      this.factura.set(factura);
      void this.prepararFacturaPdf(factura);
    }
  }

  irPasarela(codigo: string) {
    this.router.navigate(['/pasarela-pago', codigo]);
  }

  getTitulo(factura: FacturaPago) {
    return factura.tipo === 'conjunto' ? 'Pago conjunto' : 'Pago individual';
  }

  descargarFactura(factura: FacturaPago) {
    this.facturaPdfService.descargarFactura(factura);
  }

  trackByPersona(_: number, persona: PersonaFacturaPago) {
    return persona.idPersona;
  }

  trackByLinea(_: number, linea: LineaFacturaPago) {
    return `${linea.idPersona}-${linea.idItem}-${linea.producto}`;
  }

  private async prepararFacturaPdf(factura: FacturaPago) {
    const baseUrl = await this.getOrigenQrExterno();
    const payload = this.pagoService.codificarFacturaParaQr(factura);
    const urlValidacion = `${baseUrl}/validar-pedido/${factura.codigo}?data=${payload}`;
    this.pdfUrl.set(this.facturaPdfService.crearPdfUrl(factura));
    this.urlValidacion.set(urlValidacion);

    const imagen = await QRCode.toDataURL(urlValidacion, {
      width: 240,
      margin: 1,
      color: {
        dark: '#143c6b',
        light: '#fffaf0'
      }
    });

    this.qrImagen.set(imagen);
  }

  private async getOrigenQrExterno() {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return window.location.origin;
    }

    try {
      const respuesta = await fetch('/api/network-info');
      if (!respuesta.ok) {
        return window.location.origin;
      }

      const datos = await respuesta.json() as { externalOrigin?: string };
      return datos.externalOrigin || window.location.origin;
    } catch {
      return window.location.origin;
    }
  }
}
