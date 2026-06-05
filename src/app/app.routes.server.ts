import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'pago/:codigo',
    renderMode: RenderMode.Client
  },
  {
    path: 'pasarela-pago/:codigo',
    renderMode: RenderMode.Client
  },
  {
    path: 'validar-pedido/:codigo',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
