import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type TipoPago = 'conjunto' | 'individual';

export interface LineaFacturaPago {
  idItem: number;
  producto: string;
  persona: string;
  idPersona: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PersonaFacturaPago {
  idPersona: number;
  nombre: string;
  cantidadProductos: number;
  total: number;
  lineas: LineaFacturaPago[];
}

export interface FacturaPago {
  codigo: string;
  token: string;
  tipo: TipoPago;
  pedidoId: number;
  creadaEn: string;
  totalProductos: number;
  total: number;
  lineas: LineaFacturaPago[];
  personas: PersonaFacturaPago[];
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly storageKey = 'facturas_pago_restaurante';
  private readonly apiUrl = '/api';

  crearFactura(datos: Omit<FacturaPago, 'codigo' | 'token' | 'creadaEn'>) {
    const codigo = this.generarCodigo();
    const factura: FacturaPago = {
      ...datos,
      codigo,
      token: this.generarToken(),
      creadaEn: new Date().toISOString()
    };

    this.guardarFactura(factura);
    return factura;
  }

  getFactura(codigo: string) {
    return this.getFacturas()[codigo] ?? null;
  }

  codificarFacturaParaQr(factura: FacturaPago) {
    const payload = JSON.stringify({
      c: factura.codigo,
      k: factura.token,
      tp: factura.tipo,
      p: factura.pedidoId,
      f: factura.creadaEn,
      n: factura.totalProductos,
      t: factura.total,
      l: factura.lineas.map((linea) => [
        linea.idItem,
        linea.producto,
        linea.persona,
        linea.idPersona,
        linea.cantidad,
        linea.precioUnitario,
        linea.subtotal
      ]),
      ps: factura.personas.map((persona) => [
        persona.idPersona,
        persona.nombre,
        persona.cantidadProductos,
        persona.total,
        persona.lineas.map((linea) => [
          linea.idItem,
          linea.producto,
          linea.persona,
          linea.idPersona,
          linea.cantidad,
          linea.precioUnitario,
          linea.subtotal
        ])
      ])
    });
    return btoa(unescape(encodeURIComponent(payload)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  decodificarFacturaDesdeQr(payload: string) {
    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const normalizado = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const json = decodeURIComponent(escape(atob(normalizado)));
      const data = JSON.parse(json);

      return {
        codigo: data.c,
        token: data.k,
        tipo: data.tp,
        pedidoId: data.p,
        creadaEn: data.f,
        totalProductos: data.n,
        total: data.t,
        lineas: data.l.map((linea: [number, string, string, number, number, number, number]) => ({
          idItem: linea[0],
          producto: linea[1],
          persona: linea[2],
          idPersona: linea[3],
          cantidad: linea[4],
          precioUnitario: linea[5],
          subtotal: linea[6]
        })),
        personas: data.ps.map((persona: [number, string, number, number, [number, string, string, number, number, number, number][]]) => ({
          idPersona: persona[0],
          nombre: persona[1],
          cantidadProductos: persona[2],
          total: persona[3],
          lineas: persona[4].map((linea) => ({
            idItem: linea[0],
            producto: linea[1],
            persona: linea[2],
            idPersona: linea[3],
            cantidad: linea[4],
            precioUnitario: linea[5],
            subtotal: linea[6]
          }))
        }))
      } as FacturaPago;
    } catch {
      return null;
    }
  }

  /**
   * Obtiene una factura del servidor (para acceso desde dispositivos externos)
   */
  async getFacturaRemota(codigo: string): Promise<FacturaPago | null> {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/factura/${codigo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json() as FacturaPago;
    } catch {
      return null;
    }
  }

  private guardarFactura(factura: FacturaPago) {
    if (!this.isBrowser) {
      return;
    }

    // Guardar en sessionStorage local
    const facturas = this.getFacturas();
    facturas[factura.codigo] = factura;
    window.sessionStorage.setItem(this.storageKey, JSON.stringify(facturas));

    // También guardar en el servidor para acceso externo
    fetch(`${this.apiUrl}/factura`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        codigo: factura.codigo,
        data: factura
      })
    }).catch(() => {
      // Silenciar errores de red (el servidor puede no estar disponible)
    });
  }

  private getFacturas(): Record<string, FacturaPago> {
    if (!this.isBrowser) {
      return {};
    }

    const valor = window.sessionStorage.getItem(this.storageKey);

    if (!valor) {
      return {};
    }

    try {
      return JSON.parse(valor) as Record<string, FacturaPago>;
    } catch {
      return {};
    }
  }

  private generarCodigo() {
    return `FAC-${Date.now().toString(36).toUpperCase()}-${this.generarToken().slice(0, 8)}`;
  }

  private generarToken() {
    if (this.isBrowser && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(24);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}
