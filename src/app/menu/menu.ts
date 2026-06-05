import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { SharedServices } from '../services/SharedServices';
import { CarritoComponent } from '../carrito/carrito';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiUrlService } from '../services/ApiUrlService';

interface ItemMenu {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  imagen: string;
}

interface CategoriaMenu {
  categoria: string;
  id: string;
  items: ItemMenu[];
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ButtonModule, CarritoComponent],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Menu {
  private readonly http = inject(HttpClient);
  private readonly sharedServices = inject(SharedServices);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly apiUrl = inject(ApiUrlService);
  readonly categoriasFijas = ['Bebidas', 'Primero', 'Segundo', 'Postre'];

  pedidoId = 0;
  usuarioId = 0;
  readonly items = signal<ItemMenu[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly busqueda = signal('');
  readonly busquedaSinResultado = signal(false);
  readonly productoResaltadoId = signal<number | null>(null);
  readonly cantidadesSeleccionadas = signal<Record<number, number>>({});
  readonly editorAbierto = signal<Record<number, boolean>>({});
  readonly itemsAgrupados = computed<Record<string, ItemMenu[]>>(() => {
    const grupos = this.categoriasFijas.reduce<Record<string, ItemMenu[]>>((acumulado, categoria) => {
      acumulado[categoria] = [];
      return acumulado;
    }, {});

    for (const item of this.items()) {
      const categoria = this.getCategoriaItem(item);
      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }
      grupos[categoria].push(item);
    }

    return grupos;
  });
  readonly categoriasConItems = computed<CategoriaMenu[]>(() => {
    const grupos = this.itemsAgrupados();

    return this.categoriasFijas
      .map((categoria) => ({
        categoria,
        id: this.getCategoriaId(categoria),
        items: grupos[categoria] ?? []
      }))
      .filter((grupo) => grupo.items.length > 0);
  });

  constructor() {
    this.sharedServices.data_id_pedido$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((idPedido) => {
        this.pedidoId = idPedido;
      });

    this.sharedServices.data_id_usuario$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((idUsuario) => {
        this.usuarioId = idUsuario;
      });

    this.cargarItems();
  }

  cargarItems() {
    this.cargando.set(true);
    this.error.set('');

    this.http.get<ItemMenu[]>(this.apiUrl.url('/item')).subscribe({
      next: (respuesta) => {
        this.items.set(Array.isArray(respuesta) ? respuesta : []);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando items', error);
        this.error.set('No se pudieron cargar los productos desde la API.');
        this.cargando.set(false);
      }
    });
  }

  getItemsPorCategoria(categoria: string) {
    return this.itemsAgrupados()[categoria] ?? [];
  }

  actualizarBusqueda(event: Event) {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
    this.busquedaSinResultado.set(false);
  }

  limpiarBusqueda() {
    this.busqueda.set('');
    this.busquedaSinResultado.set(false);
    this.productoResaltadoId.set(null);
  }

  buscarProducto() {
    const termino = this.normalizarTexto(this.busqueda());

    if (!termino) {
      this.busquedaSinResultado.set(false);
      return;
    }

    const itemEncontrado = this.encontrarProductoMasParecido(termino);

    if (!itemEncontrado) {
      this.productoResaltadoId.set(null);
      this.busquedaSinResultado.set(true);
      return;
    }

    this.busquedaSinResultado.set(false);
    this.productoResaltadoId.set(itemEncontrado.id);
    this.moverACategoria(`producto-${itemEncontrado.id}`);

    this.document.defaultView?.setTimeout(() => {
      if (this.productoResaltadoId() === itemEncontrado.id) {
        this.productoResaltadoId.set(null);
      }
    }, 2500);
  }

  estaProductoResaltado(itemId: number) {
    return this.productoResaltadoId() === itemId;
  }

  getCategoriaId(categoria: string) {
    return categoria.trim().toLowerCase();
  }

  scrollACategoria(categoriaId: string) {
    this.moverACategoria(categoriaId);
  }

  private moverACategoria(categoriaId: string) {
    const seccion = this.document.getElementById(categoriaId);
    const ventana = this.document.defaultView;

    if (!seccion || !ventana) {
      return;
    }

    const barra = this.document.querySelector('.menu-barra-superior') as HTMLElement | null;
    const margenSuperior = (barra?.offsetHeight ?? 0) + 24;
    const posicion = seccion.getBoundingClientRect().top + ventana.scrollY - margenSuperior;

    ventana.scrollTo({
      top: Math.max(posicion, 0),
      behavior: 'smooth'
    });
  }

  getCategoriaItem(item: ItemMenu) {
    if (typeof item.categoria === 'string' && item.categoria.trim().length > 0) {
      const categoria = item.categoria.trim().toLowerCase();

      if (categoria === 'bebidas' || categoria === 'bebida') {
        return 'Bebidas';
      }

      if (categoria === 'primero' || categoria === 'primeros') {
        return 'Primero';
      }

      if (categoria === 'segundo' || categoria === 'segundos') {
        return 'Segundo';
      }

      if (categoria === 'postre' || categoria === 'postres') {
        return 'Postre';
      }
    }

    return 'Sin categoria';
  }

  getCantidadSeleccionada(itemId: number) {
    return this.cantidadesSeleccionadas()[itemId] ?? 0;
  }

  estaEditorAbierto(itemId: number) {
    return this.editorAbierto()[itemId] ?? false;
  }

  abrirSelector(itemId: number) {
    this.editorAbierto.update((actual) => ({
      ...actual,
      [itemId]: true
    }));

    this.cantidadesSeleccionadas.update((actual) => ({
      ...actual,
      [itemId]: actual[itemId] && actual[itemId] > 0 ? actual[itemId] : 1
    }));
  }

  incrementarSeleccion(itemId: number) {
    this.cantidadesSeleccionadas.update((actual) => ({
      ...actual,
      [itemId]: (actual[itemId] ?? 0) + 1
    }));
  }

  decrementarSeleccion(itemId: number) {
    this.cantidadesSeleccionadas.update((actual) => ({
      ...actual,
      [itemId]: Math.max((actual[itemId] ?? 0) - 1, 0)
    }));
  }

  confirmarAnadir(item: ItemMenu) {
    const cantidad = this.getCantidadSeleccionada(item.id);
    if (!this.pedidoId) {
      console.error('No hay pedido guardado para añadir productos');
      return;
    }

    if (!this.usuarioId) {
      console.error('No hay usuario guardado para añadir productos');
      return;
    }

    if (cantidad <= 0) {
      return;
    }

    this.http.post(this.apiUrl.url(`/pedidos/${this.pedidoId}/${item.id}/${cantidad}/${this.usuarioId}`), {}).subscribe({
      next: () => {
        this.cantidadesSeleccionadas.update((actual) => ({
          ...actual,
          [item.id]: 0
        }));
        this.editorAbierto.update((actual) => ({
          ...actual,
          [item.id]: false
        }));
        this.sharedServices.notificarCarritoActualizado();
      },
      error: (error) => {
        console.error('Error al añadir el producto', error);
      }
    });
  }

  trackByCategoria(_: number, categoria: string) {
    return categoria;
  }

  trackByCategoriaMenu(_: number, categoria: CategoriaMenu) {
    return categoria.id;
  }

  trackByItem(_: number, item: ItemMenu) {
    return item.id;
  }

  private normalizarTexto(valor: string) {
    return valor
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private encontrarProductoMasParecido(termino: string) {
    let mejorItem: ItemMenu | null = null;
    let mejorPuntuacion = 0;

    for (const item of this.items()) {
      const nombre = this.normalizarTexto(item.nombre);
      const categoria = this.normalizarTexto(this.getCategoriaItem(item));
      const puntuacion = Math.max(
        this.calcularCoincidencia(termino, nombre),
        this.calcularCoincidencia(termino, categoria)
      );

      if (puntuacion > mejorPuntuacion) {
        mejorPuntuacion = puntuacion;
        mejorItem = item;
      }
    }

    return mejorPuntuacion >= 0.45 ? mejorItem : null;
  }

  private calcularCoincidencia(termino: string, texto: string) {
    if (texto.includes(termino)) {
      return 1;
    }

    if (termino.includes(texto)) {
      return 0.9;
    }

    const palabras = texto.split(/\s+/).filter(Boolean);
    if (palabras.some((palabra) => palabra.startsWith(termino) || termino.startsWith(palabra))) {
      return 0.82;
    }

    const coincidencias = [...termino].filter((letra) => texto.includes(letra)).length;
    return coincidencias / Math.max(termino.length, texto.length);
  }
}
