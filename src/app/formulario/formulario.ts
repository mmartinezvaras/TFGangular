import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Router, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SharedServices } from '../services/SharedServices';
import { ApiUrlService } from '../services/ApiUrlService';

export interface Pedido{
    id?: number;
    idSala: number;
    finalizado: boolean;
} 

export interface Persona {
  id?: number;
  nombre: string;
}
export interface Sala {
  id?: number;
  clienteId: number;
  codigo: string;
}

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [InputTextModule, MessageModule, ToastModule, ButtonModule, FormsModule, RouterOutlet],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Formulario {
  http = inject(HttpClient);
  protected readonly title = signal('TFGangular');
  messageService = inject(MessageService);
  router = inject(Router);
  sharedServices = inject(SharedServices);
  private readonly apiUrl = inject(ApiUrlService);

  nombre: string = '';
  sala_codigo: string = '';

  onSubmit(form: any) {
    if (!form.valid) {
      return;
    }
    const body = {
      nombre: this.nombre,
    };

    this.http.post<Persona>(this.apiUrl.url('/login'), body).subscribe({
      next: (persona_creada) => {
        this.unirseOCrearSala(persona_creada);
      },
      error: (error) => {
        console.error(error);
      }

    });
  }

  private unirseOCrearSala(personaCreada: Persona) {
    this.http.get<Sala>(this.apiUrl.url(`/sala/codigo/${this.sala_codigo}`)).subscribe({
      next: (salaExistente) => {
        this.entrarEnSala(salaExistente, personaCreada);
      },
      error: () => {
        const body_sala = {
          clienteId: personaCreada.id,
          codigo: this.sala_codigo
        };

        this.http.post<Sala>(this.apiUrl.url('/sala'), body_sala).subscribe({
          next: (salaCreada) => {
            this.entrarEnSala(salaCreada, personaCreada);
          },
          error: (error) => {
            console.error(error);
          }
        });
      }
    });
  }

  private entrarEnSala(sala: Sala, persona: Persona) {
    this.http.post<Pedido>(this.apiUrl.url(`/pedidos/crear-pedido/${sala.id}`), {}).subscribe({
      next: (pedidoCreado) => {
        this.sharedServices.setDataIdPedido(pedidoCreado.id!);
        this.sharedServices.setDataUsuario(persona.id!);
        this.sharedServices.setDataNombreUsuario(persona.nombre);
        this.sharedServices.setDataIdSala(sala.id!);

        this.messageService.add({
          severity: 'success',
          summary: 'Acceso correcto',
          detail: `Conectado a la sala ${sala.codigo}`,
          life: 3000
        });

        this.router.navigate(['/menu']);
      },
      error: (error) => {
        console.error('Error al crear o recuperar el pedido', error);
      }
    });
  }
}
