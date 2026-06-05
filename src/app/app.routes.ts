import { Routes } from '@angular/router';
import { Formulario } from './formulario/formulario';
import { Menu } from './menu/menu';
import { PagoComponent } from './pago/pago';
import { PasarelaPagoComponent } from './pasarela-pago/pasarela-pago';
import { ValidarPedidoComponent } from './validar-pedido/validar-pedido';

export const routes: Routes = [
  { path: '', component: Formulario },
  { path: 'menu', component: Menu },
  { path: 'pago/:codigo', component: PagoComponent },
  { path: 'pasarela-pago/:codigo', component: PasarelaPagoComponent },
  { path: 'validar-pedido/:codigo', component: ValidarPedidoComponent }
];
