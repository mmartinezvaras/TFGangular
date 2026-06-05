import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import cors from 'cors';
import { networkInterfaces } from 'node:os';

const browserDistFolder = join(import.meta.dirname, '../browser');
const allowedSsrHosts = ['*'];

const app = express();
app.use(cors());
const angularApp = new AngularNodeAppEngine({
  allowedHosts: allowedSsrHosts,
});

// Almacenamiento en memoria para facturas (accesible desde cualquier dispositivo)
const facturasCache = new Map<string, object>();

/**
 * Get the local IP address for network access
 */
function getLocalIpAddress(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Skip internal (loopback) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// ==== MIDDLEWARE CORS (primero para todas las rutas) ====
app.use((req, res, next): void => {
  // Permitir cualquier origen desde la red local
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// ==== PARSE JSON ====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==== ARCHIVOS ESTÁTICOS ====
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Middleware para permitir CORS en rutas de API
 */
app.use((req, res, next): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

/**
 * API endpoint para generar y servir el PDF de factura
 * Uso: GET /factura/:codigo
 * Redirige a la ruta del frontend que genera el PDF
 */
app.get('/factura/:codigo', (req, res): void => {
  const { codigo } = req.params;
  res.redirect(`/pago/${codigo}`);
});

/**
 * Endpoint para guardar una factura desde el cliente
 * Uso: POST /api/factura con body { codigo, data }
 */
app.post('/api/factura', (req, res): void => {
  const { codigo, data } = req.body;
  
  if (!codigo || !data) {
    res.status(400).json({ error: 'Faltan datos requeridos' });
    return;
  }
  
  facturasCache.set(codigo, data);
  res.json({ mensaje: 'Factura guardada', codigo });
});

/**
 * Endpoint para obtener una factura desde cualquier dispositivo
 * Uso: GET /api/factura/:codigo
 */
app.get('/api/factura/:codigo', (req, res): void => {
  const { codigo } = req.params;
  const factura = facturasCache.get(codigo);
  
  if (!factura) {
    res.status(404).json({ error: 'Factura no encontrada' });
    return;
  }
  
  res.json(factura);
});

app.get('/api/network-info', (req, res): void => {
  const protocol = req.protocol;
  const port = req.socket.localPort || Number(process.env['PORT'] || 4000);
  res.json({
    localIp: getLocalIpAddress(),
    externalOrigin: `${protocol}://${getLocalIpAddress()}:${port}`
  });
});

/**
 * Endpoint alternativo para acceso externo sin redirección
 * Uso: GET /api/descargar/:codigo
 */
app.get('/api/descargar/:codigo', (req, res): void => {
  const { codigo } = req.params;
  const factura = facturasCache.get(codigo);
  
  if (!factura) {
    res.json({ 
      mensaje: 'Usa FacturaPdfService en el cliente para generar el PDF',
      codigo: codigo,
      instruccion: 'Accede desde el mismo navegador donde se creó el pedido'
    });
    return;
  }
  
  res.json(factura);
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT'] || 4000);
  const host = process.env['HOST'] || '0.0.0.0';
  const localIp = getLocalIpAddress();
  
  app.listen(port, host, (error) => {
    if (error) {
      throw error;
    }

    console.log(`╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  Servidor Angular SSR iniciado                              ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Accesible desde este equipo:                               ║`);
    console.log(`║    → http://localhost:${port}                                ║`);
    console.log(`║    → http://127.0.0.1:${port}                               ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Accesible desde dispositivos externos:                    ║`);
    console.log(`║    → http://${localIp}:${port}                              ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Asegúrate de que el puerto ${port} esté abierto en        ║`);
    console.log(`║  el firewall del sistema para acceso externo.              ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
