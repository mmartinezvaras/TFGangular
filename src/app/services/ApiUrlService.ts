import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiUrlService {
  private readonly backendPort = '8080';

  get baseUrl() {
    if (typeof window === 'undefined') {
      return `http://localhost:${this.backendPort}`;
    }

    const { protocol, hostname } = window.location;
    const backendHost = hostname === '127.0.0.1' ? 'localhost' : hostname;

    return `${protocol}//${backendHost}:${this.backendPort}`;
  }

  url(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }
}
