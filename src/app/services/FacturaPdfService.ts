import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { FacturaPago } from './PagoService';

@Injectable({
  providedIn: 'root'
})
export class FacturaPdfService {
  crearPdfBlob(factura: FacturaPago, incluirRastreo = false) {
    return this.crearDocumento(factura, incluirRastreo).output('blob');
  }

  crearPdfUrl(factura: FacturaPago, incluirRastreo = false) {
    return URL.createObjectURL(this.crearPdfBlob(factura, incluirRastreo));
  }

  descargarFactura(factura: FacturaPago, incluirRastreo = false) {
    const url = this.crearPdfUrl(factura, incluirRastreo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = incluirRastreo ? `factura-interna-${factura.codigo}.pdf` : 'factura-restaurante-marcos.pdf';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private crearDocumento(factura: FacturaPago, incluirRastreo: boolean) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margen = 16;
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(20, 60, 107);
    doc.text('Factura Restaurante Marcos', margen, y);

    y += 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 70, 65);
    doc.text(incluirRastreo ? `Factura: ${factura.codigo}` : 'Factura de cliente', margen, y);
    doc.text(`Fecha: ${new Date(factura.creadaEn).toLocaleString('es-ES')}`, 118, y);

    if (incluirRastreo) {
      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(215, 25, 32);
      doc.text(`Rastreo interno - Pedido ID: ${factura.pedidoId}`, margen, y);
      doc.text(`Token: ${factura.token.slice(0, 18)}...`, 118, y);
    }

    y += 10;
    doc.setFillColor(215, 25, 32);
    doc.roundedRect(margen, y, 178, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(factura.tipo === 'conjunto' ? 'Pago conjunto' : 'Pago por separado', margen + 6, y + 8);
    doc.setFontSize(18);
    doc.text(`${factura.total.toFixed(2)} EUR`, margen + 6, y + 17);
    doc.setFontSize(10);
    doc.text(`${factura.totalProductos} productos`, 150, y + 8);
    doc.text(`${factura.personas.length} personas`, 150, y + 17);

    y += 34;
    doc.setTextColor(20, 60, 107);
    doc.setFontSize(14);
    doc.text('Detalle de productos', margen, y);

    y += 8;
    this.dibujarCabeceraTabla(doc, y);
    y += 8;

    for (const linea of factura.lineas) {
      if (y > 270) {
        doc.addPage();
        y = 18;
        this.dibujarCabeceraTabla(doc, y);
        y += 8;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(36, 17, 15);
      doc.text(this.recortar(linea.producto, 32), margen, y);
      doc.text(this.recortar(linea.persona, 24), 68, y);
      doc.text(String(linea.cantidad), 116, y, { align: 'right' });
      doc.text(`${linea.precioUnitario.toFixed(2)} EUR`, 146, y, { align: 'right' });
      doc.text(`${linea.subtotal.toFixed(2)} EUR`, 194, y, { align: 'right' });
      y += 7;
    }

    if (factura.tipo === 'individual') {
      y += 8;
      if (y > 252) {
        doc.addPage();
        y = 18;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(20, 60, 107);
      doc.text('Resumen por persona', margen, y);
      y += 8;

      for (const persona of factura.personas) {
        if (y > 270) {
          doc.addPage();
          y = 18;
        }

        doc.setFontSize(10);
        doc.setTextColor(36, 17, 15);
        doc.text(persona.nombre, margen, y);
        doc.text(`${persona.cantidadProductos} productos`, 104, y);
        doc.text(`${persona.total.toFixed(2)} EUR`, 194, y, { align: 'right' });
        y += 7;
      }
    }

    y = Math.max(y + 10, 280);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(215, 25, 32);
    doc.text(`Total factura: ${factura.total.toFixed(2)} EUR`, 194, Math.min(y, 286), { align: 'right' });

    return doc;
  }

  private dibujarCabeceraTabla(doc: jsPDF, y: number) {
    doc.setFillColor(255, 240, 217);
    doc.roundedRect(14, y - 5, 182, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(154, 116, 103);
    doc.text('Producto', 16, y);
    doc.text('Persona', 68, y);
    doc.text('Uds.', 116, y, { align: 'right' });
    doc.text('Precio ud.', 146, y, { align: 'right' });
    doc.text('Subtotal', 194, y, { align: 'right' });
  }

  private recortar(valor: string, longitud: number) {
    return valor.length > longitud ? `${valor.slice(0, longitud - 1)}.` : valor;
  }
}
