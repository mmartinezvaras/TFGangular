import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SharedServices } from '../services/SharedServices';
import { LineaFacturaPago, PagoService, PersonaFacturaPago, TipoPago } from '../services/PagoService';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, firstValueFrom, fromEvent, timer } from 'rxjs';
import { ApiUrlService } from '../services/ApiUrlService';

interface LineaCarrito {
  id: number;
  idItem: number;
  cantidad: number;
  entregado: boolean;
  idPedido: number;
  idPersona: number;
}

interface ItemCarritoDetalle {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  imagen: string;
}

interface LineaCarritoAgrupada {
  idItem: number;
  entregado: boolean;
  cantidadTotal: number;
  idPersona: number;
}

interface PersonaDetalle {
  id: number;
  nombre: string;
}

interface ResumenPagoPersona {
  idPersona: number;
  nombre: string;
  cantidadProductos: number;
  total: number;
  lineas: LineaCarritoAgrupada[];
}

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarritoComponent {
  private static readonly POLLING_INTERVAL_MS = 12000;

  private readonly sharedServices = inject(SharedServices);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly pagoService = inject(PagoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private pollingSub?: Subscription;
  private ultimaFirmaCarrito = '';
  private readonly detallesItemsPendientes = new Set<number>();
  private readonly detallesPersonasPendientes = new Set<number>();

  pedidoId = 0;
  usuarioId = 0;
  readonly carrito = signal<LineaCarrito[]>([]);
  readonly itemsInfo = signal<Record<number, ItemCarritoDetalle>>({});
  readonly personasInfo = signal<Record<number, PersonaDetalle>>({});
  readonly cantidadesEdicion = signal<Record<string, number>>({});
  readonly editorAbierto = signal<Record<string, boolean>>({});
  readonly cargando = signal(false);
  readonly modoPago = signal<'conjunto' | 'individual'>('conjunto');
  readonly personaPagoSeleccionada = signal<number>(0);
  readonly carritoAbierto = signal(false);
  readonly pagoAbierto = signal(false);
  readonly pagoEnProceso = signal(false);
  readonly avisoPago = signal('');

  readonly carritoAgrupado = computed<LineaCarritoAgrupada[]>(() => {
    const grupos = new Map<string, LineaCarritoAgrupada>();

    for (const item of this.carrito()) {
      const clave = `${item.idItem}-${item.entregado}-${item.idPersona}`;
      const existente = grupos.get(clave);

      if (existente) {
        existente.cantidadTotal += item.cantidad;
      } else {
        grupos.set(clave, {
          idItem: item.idItem,
          entregado: item.entregado,
          cantidadTotal: item.cantidad,
          idPersona: item.idPersona
        });
      }
    }

    return Array.from(grupos.values());
  });

  readonly cantidadTotal = computed(() =>
    this.carritoAgrupado().reduce((total, item) => total + item.cantidadTotal, 0)
  );

  readonly productosPendientes = computed(() =>
    this.carritoAgrupado().filter((item) => !item.entregado)
  );

  readonly cantidadProductosPendientes = computed(() =>
    this.productosPendientes().reduce((total, item) => total + item.cantidadTotal, 0)
  );

  readonly pagoBloqueado = computed(() => this.cantidadProductosPendientes() > 0);

  readonly totalCarrito = computed(() =>
    this.carritoAgrupado().reduce((total, item) => total + this.getSubtotalAgrupado(item), 0)
  );

  readonly resumenPagoPersonas = computed<ResumenPagoPersona[]>(() => {
    const resumenes = new Map<number, ResumenPagoPersona>();

    for (const item of this.carritoAgrupado()) {
      const subtotal = this.getSubtotalAgrupado(item);
      const existente = resumenes.get(item.idPersona);

      if (existente) {
        existente.cantidadProductos += item.cantidadTotal;
        existente.total += subtotal;
        existente.lineas.push(item);
      } else {
        resumenes.set(item.idPersona, {
          idPersona: item.idPersona,
          nombre: this.getPersonaNombre(item.idPersona),
          cantidadProductos: item.cantidadTotal,
          total: subtotal,
          lineas: [item]
        });
      }
    }

    return Array.from(resumenes.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  constructor() {
    this.sharedServices.data_id_pedido$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((idPedido) => {
        this.pedidoId = idPedido;
        this.reiniciarPolling();
      });

    this.sharedServices.data_id_usuario$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((idUsuario) => {
        this.usuarioId = idUsuario;
        if (!this.personaPagoSeleccionada() && idUsuario) {
          this.personaPagoSeleccionada.set(idUsuario);
        }
      });

    this.sharedServices.carritoActualizado$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.pedidoId) {
          this.cargarCarrito();
        }
      });

    if (this.isBrowser) {
      fromEvent(document, 'visibilitychange')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (!document.hidden && this.pedidoId) {
            this.cargarCarrito();
          }
        });
    }
  }

  cargarCarrito() {
    if (!this.pedidoId) {
      this.carrito.set([]);
      this.ultimaFirmaCarrito = '';
      return;
    }

    if (!this.carrito().length) {
      this.cargando.set(true);
    }

    this.http.get<LineaCarrito[]>(this.apiUrl.url(`/pedidos/${this.pedidoId}`)).subscribe({
      next: (respuesta) => {
        this.actualizarCarritoDesdeRespuesta(respuesta);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar carrito', error);
        this.cargando.set(false);
      }
    });
  }

  getItemInfo(idItem: number) {
    return this.itemsInfo()[idItem];
  }

  getEstadoTexto(entregado: boolean) {
    return entregado ? 'Entregado' : 'Pendiente';
  }

  getPersonaNombre(idPersona: number) {
    return this.personasInfo()[idPersona]?.nombre || `Persona ${idPersona}`;
  }

  getSubtotalAgrupado(item: LineaCarritoAgrupada) {
    const precio = this.getItemInfo(item.idItem)?.precio ?? 0;
    return precio * item.cantidadTotal;
  }

  getCantidadEditable(item: LineaCarritoAgrupada) {
    return this.cantidadesEdicion()[this.getClaveEdicion(item)] ?? item.cantidadTotal;
  }

  setModoPago(modo: 'conjunto' | 'individual') {
    this.modoPago.set(modo);

    if (modo === 'individual' && !this.getResumenPersonaSeleccionada()) {
      const primerResumen = this.resumenPagoPersonas()[0];
      this.personaPagoSeleccionada.set(primerResumen?.idPersona ?? 0);
    }
  }

  toggleCarrito() {
    const nuevoEstado = !this.carritoAbierto();
    this.carritoAbierto.set(nuevoEstado);

    if (nuevoEstado && this.pedidoId) {
      this.cargarCarrito();
    }
  }

  togglePago() {
    const nuevoEstado = !this.pagoAbierto();
    this.pagoAbierto.set(nuevoEstado);

    if (nuevoEstado && this.pedidoId) {
      this.cargarCarrito();
    }
  }

  estaEditorAbiertoItem(item: LineaCarritoAgrupada) {
    return this.editorAbierto()[this.getClaveEdicion(item)] ?? false;
  }

  seleccionarPersonaPago(idPersona: number) {
    this.personaPagoSeleccionada.set(idPersona);
  }

  esPersonaPagoSeleccionada(idPersona: number) {
    return this.personaPagoSeleccionada() === idPersona;
  }

  async iniciarPago(tipo: TipoPago) {
    if (this.pagoEnProceso()) {
      return;
    }

    this.pagoEnProceso.set(true);
    this.avisoPago.set('');

    const carritoActualizado = await this.cargarCarritoParaPago();

    if (!carritoActualizado) {
      this.pagoEnProceso.set(false);
      return;
    }

    if (carritoActualizado.some((item) => !item.entregado)) {
      this.carritoAbierto.set(true);
      this.pagoAbierto.set(true);
      this.avisoPago.set('No se puede pagar mientras haya productos pendientes. Puedes eliminarlos del carrito o esperar a que sean entregados.');
      this.pagoEnProceso.set(false);
      return;
    }

    await this.asegurarDetallesFactura();
    const lineas = this.crearLineasFactura();

    if (!lineas.length) {
      this.pagoEnProceso.set(false);
      return;
    }

    const personas = this.crearPersonasFactura(lineas);
    const total = this.redondear(lineas.reduce((acumulado, linea) => acumulado + linea.subtotal, 0));
    const factura = this.pagoService.crearFactura({
      tipo,
      pedidoId: this.pedidoId,
      totalProductos: lineas.reduce((acumulado, linea) => acumulado + linea.cantidad, 0),
      total,
      lineas,
      personas
    });

    this.router.navigate(['/pago', factura.codigo]);
    this.pagoEnProceso.set(false);
  }

  getResumenPersonaSeleccionada() {
    const resumenes = this.resumenPagoPersonas();
    return resumenes.find((resumen) => resumen.idPersona === this.personaPagoSeleccionada())
      ?? resumenes[0]
      ?? null;
  }

  abrirEditor(item: LineaCarritoAgrupada) {
    if (item.entregado || item.idPersona !== this.usuarioId) {
      return;
    }

    this.editorAbierto.update((actual) => ({
      ...actual,
      [this.getClaveEdicion(item)]: true
    }));

    this.cantidadesEdicion.update((actual) => ({
      ...actual,
      [this.getClaveEdicion(item)]: item.cantidadTotal
    }));
  }

  incrementarCantidad(item: LineaCarritoAgrupada) {
    if (item.entregado) {
      return;
    }

    this.cantidadesEdicion.update((actual) => ({
      ...actual,
      [this.getClaveEdicion(item)]: this.getCantidadEditable(item) + 1
    }));
  }

  decrementarCantidad(item: LineaCarritoAgrupada) {
    if (item.entregado) {
      return;
    }

    this.cantidadesEdicion.update((actual) => ({
      ...actual,
      [this.getClaveEdicion(item)]: Math.max(this.getCantidadEditable(item) - 1, 0)
    }));
  }

  confirmarCambio(item: LineaCarritoAgrupada) {
    if (item.entregado || !this.pedidoId || item.idPersona !== this.usuarioId) {
      return;
    }

    const nuevaCantidad = this.getCantidadEditable(item);

    if (nuevaCantidad === item.cantidadTotal) {
      return;
    }

    if (nuevaCantidad <= 0) {
      this.http.delete(this.apiUrl.url(`/pedidos/${this.pedidoId}/${item.idItem}/${item.idPersona}`)).subscribe({
        next: () => {
          this.sharedServices.notificarCarritoActualizado();
          this.editorAbierto.update((actual) => {
            const copia = { ...actual };
            delete copia[this.getClaveEdicion(item)];
            return copia;
          });
          this.cantidadesEdicion.update((actual) => {
            const copia = { ...actual };
            delete copia[this.getClaveEdicion(item)];
            return copia;
          });
        },
        error: (error) => {
          console.error('Error al eliminar del carrito', error);
        }
      });
      return;
    }

    this.http.patch(this.apiUrl.url(`/pedidos/actualizar-cantidad/${this.pedidoId}/${item.idItem}/${item.idPersona}`), nuevaCantidad).subscribe({
      next: () => {
        this.editorAbierto.update((actual) => ({
          ...actual,
          [this.getClaveEdicion(item)]: false
        }));
        this.sharedServices.notificarCarritoActualizado();
      },
      error: (error) => {
        console.error('Error al actualizar el carrito', error);
      }
    });
  }

  trackByLineaCarrito(_: number, item: LineaCarritoAgrupada) {
    return `${item.idItem}-${item.idPersona}-${item.entregado}`;
  }

  trackByResumenPersona(_: number, item: ResumenPagoPersona) {
    return item.idPersona;
  }

  private reiniciarPolling() {
    this.pollingSub?.unsubscribe();

    if (!this.pedidoId) {
      this.carrito.set([]);
      this.itemsInfo.set({});
      this.personasInfo.set({});
      this.cantidadesEdicion.set({});
      this.editorAbierto.set({});
      this.detallesItemsPendientes.clear();
      this.detallesPersonasPendientes.clear();
      this.ultimaFirmaCarrito = '';
      return;
    }

    this.pollingSub = timer(0, CarritoComponent.POLLING_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isBrowser && document.hidden) {
          return;
        }

        if (!this.carritoAbierto() && !this.pagoAbierto() && this.carrito().length > 0) {
          return;
        }

        this.cargarCarrito();
      });
  }

  private sincronizarCantidadesEdicion(carritoActual: LineaCarrito[]) {
    const cantidadesActuales = { ...this.cantidadesEdicion() };
    const editoresActuales = { ...this.editorAbierto() };
    const clavesVigentes = new Set<string>();
    const cantidadesPorClave = new Map<string, number>();

    for (const item of carritoActual) {
      if (item.entregado) {
        continue;
      }

      const clave = `${item.idItem}-${item.idPersona}`;
      clavesVigentes.add(clave);
      cantidadesPorClave.set(clave, (cantidadesPorClave.get(clave) ?? 0) + item.cantidad);
    }

    for (const [clave, cantidad] of cantidadesPorClave.entries()) {
      if (!editoresActuales[clave]) {
        cantidadesActuales[clave] = cantidad;
      } else if (cantidadesActuales[clave] === undefined) {
        cantidadesActuales[clave] = cantidad;
      }
    }

    for (const clave of Object.keys(cantidadesActuales)) {
      if (!clavesVigentes.has(clave)) {
        delete cantidadesActuales[clave];
      }
    }

    for (const clave of Object.keys(editoresActuales)) {
      if (!clavesVigentes.has(clave)) {
        delete editoresActuales[clave];
      }
    }

    this.cantidadesEdicion.set(cantidadesActuales);
    this.editorAbierto.set(editoresActuales);
  }

  private getClaveEdicion(item: LineaCarritoAgrupada) {
    return `${item.idItem}-${item.idPersona}`;
  }

  private async cargarCarritoParaPago() {
    try {
      const respuesta = await firstValueFrom(this.http.get<LineaCarrito[]>(this.apiUrl.url(`/pedidos/${this.pedidoId}`)));
      return this.actualizarCarritoDesdeRespuesta(respuesta, true);
    } catch (error) {
      console.error('Error al verificar el carrito antes del pago', error);
      this.avisoPago.set('No se pudo comprobar el estado del pedido. Inténtalo de nuevo antes de pagar.');
      return null;
    }
  }

  private actualizarCarritoDesdeRespuesta(respuesta: LineaCarrito[], forzarActualizacion = false) {
    const carrito = Array.isArray(respuesta) ? respuesta : [];
    const firmaNueva = this.generarFirmaCarrito(carrito);

    if (!forzarActualizacion && firmaNueva === this.ultimaFirmaCarrito) {
      return carrito;
    }

    this.ultimaFirmaCarrito = firmaNueva;
    this.carrito.set(carrito);
    this.sincronizarCantidadesEdicion(carrito);
    this.cargarDetallesItems(carrito);

    if (!carrito.some((item) => !item.entregado)) {
      this.avisoPago.set('');
    }

    return carrito;
  }

  private crearLineasFactura(): LineaFacturaPago[] {
    return this.carritoAgrupado().map((item) => {
      const info = this.getItemInfo(item.idItem);
      const precioUnitario = info?.precio ?? 0;

      return {
        idItem: item.idItem,
        producto: info?.nombre || `Producto ${item.idItem}`,
        persona: this.getPersonaNombre(item.idPersona),
        idPersona: item.idPersona,
        cantidad: item.cantidadTotal,
        precioUnitario,
        subtotal: this.redondear(precioUnitario * item.cantidadTotal)
      };
    });
  }

  private async asegurarDetallesFactura() {
    const carrito = this.carritoAgrupado();
    const itemsActuales = this.itemsInfo();
    const personasActuales = this.personasInfo();

    const peticionesItems = [...new Set(carrito.map((item) => item.idItem))]
      .filter((idItem) => !itemsActuales[idItem])
      .map(async (idItem) => {
        const detalle = await firstValueFrom(this.http.get<ItemCarritoDetalle>(this.apiUrl.url(`/item/${idItem}`)));
        this.itemsInfo.update((actual) => ({
          ...actual,
          [idItem]: detalle
        }));
      });

    const peticionesPersonas = [...new Set(carrito.map((item) => item.idPersona))]
      .filter((idPersona) => !personasActuales[idPersona])
      .map(async (idPersona) => {
        const detalle = await firstValueFrom(this.http.get<PersonaDetalle>(this.apiUrl.url(`/login/${idPersona}`)));
        this.personasInfo.update((actual) => ({
          ...actual,
          [idPersona]: detalle
        }));
      });

    await Promise.allSettled([...peticionesItems, ...peticionesPersonas]);
  }

  private crearPersonasFactura(lineas: LineaFacturaPago[]): PersonaFacturaPago[] {
    const personas = new Map<number, PersonaFacturaPago>();

    for (const linea of lineas) {
      const persona = personas.get(linea.idPersona);

      if (persona) {
        persona.cantidadProductos += linea.cantidad;
        persona.total = this.redondear(persona.total + linea.subtotal);
        persona.lineas.push(linea);
      } else {
        personas.set(linea.idPersona, {
          idPersona: linea.idPersona,
          nombre: linea.persona,
          cantidadProductos: linea.cantidad,
          total: linea.subtotal,
          lineas: [linea]
        });
      }
    }

    return Array.from(personas.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  private redondear(valor: number) {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private generarFirmaCarrito(carrito: LineaCarrito[]) {
    return JSON.stringify(
      [...carrito]
        .map((item) => ({
          id: item.id,
          idItem: item.idItem,
          cantidad: item.cantidad,
          entregado: item.entregado,
          idPedido: item.idPedido,
          idPersona: item.idPersona
        }))
        .sort((a, b) =>
          a.idPedido - b.idPedido
          || a.idPersona - b.idPersona
          || a.idItem - b.idItem
          || a.id - b.id
        )
    );
  }

  private cargarDetallesItems(carrito: LineaCarrito[]) {
    const idsUnicos = [...new Set(carrito.map((item) => item.idItem))];
    const mapaActual = this.itemsInfo();
    const personasUnicas = [...new Set(carrito.map((item) => item.idPersona))];
    const personasActuales = this.personasInfo();

    idsUnicos.forEach((idItem) => {
      if (mapaActual[idItem] || this.detallesItemsPendientes.has(idItem)) {
        return;
      }

      this.detallesItemsPendientes.add(idItem);
      this.http.get<ItemCarritoDetalle>(this.apiUrl.url(`/item/${idItem}`)).subscribe({
        next: (detalle) => {
          this.itemsInfo.update((actual) => ({
            ...actual,
            [idItem]: detalle
          }));
          this.detallesItemsPendientes.delete(idItem);
        },
        error: (error) => {
          this.detallesItemsPendientes.delete(idItem);
          console.error('Error al cargar detalle del item', error);
        }
      });
    });

    personasUnicas.forEach((idPersona) => {
      if (personasActuales[idPersona] || this.detallesPersonasPendientes.has(idPersona)) {
        return;
      }

      this.detallesPersonasPendientes.add(idPersona);
      this.http.get<PersonaDetalle>(this.apiUrl.url(`/login/${idPersona}`)).subscribe({
        next: (detalle) => {
          this.personasInfo.update((actual) => ({
            ...actual,
            [idPersona]: detalle
          }));
          this.detallesPersonasPendientes.delete(idPersona);

          if (!this.personaPagoSeleccionada()) {
            this.personaPagoSeleccionada.set(this.usuarioId || idPersona);
          }
        },
        error: (error) => {
          this.detallesPersonasPendientes.delete(idPersona);
          console.error('Error al cargar detalle de la persona', error);
        }
      });
    });
  }
}
