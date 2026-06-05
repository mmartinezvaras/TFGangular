import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Router, RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [InputTextModule, MessageModule, ToastModule, ButtonModule, FormsModule, RouterOutlet],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  

}
