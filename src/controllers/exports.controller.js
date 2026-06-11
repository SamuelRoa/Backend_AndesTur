import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { staffModel } from '../models/staff.models.js';
import { VehiclesModel } from '../models/vehicles.models.js';
import { destinationsModel } from '../models/destinations.models.js';
import { MunicipalityModel } from '../models/municipality.models.js';
import { StateModel } from '../models/state.models.js';
import { packagesModel } from '../models/packages.models.js';
import { reservationsModel } from '../models/reservations.models.js';
import { customersModel } from '../models/customers.models.js';
import { usersModel } from '../models/users.models.js';

const MODULES = {
  empleados: {
    model: staffModel,
    include: [{ model: usersModel, attributes: ['email', 'username'] }],
    fields: [
      { key: 'id_staff', label: 'ID' },
      { key: 'name', label: 'Nombre' },
      { key: 'last_name', label: 'Apellido' },
      { key: 'dni', label: 'DNI' },
      { key: 'type', label: 'Tipo' },
      { key: 'User.email', label: 'Email' },
      { key: 'User.username', label: 'Usuario' },
    ],
    title: 'Reporte de Empleados',
    mapRow: (r) => ({
      id_staff: r.id_staff,
      name: r.name,
      last_name: r.last_name,
      dni: r.dni,
      type: r.type,
      'User.email': r.User?.email || '',
      'User.username': r.User?.username || '',
    }),
  },
  vehiculos: {
    model: VehiclesModel,
    include: [],
    fields: [
      { key: 'id_vehicle', label: 'ID' },
      { key: 'plate', label: 'Placa' },
      { key: 'brand', label: 'Marca' },
      { key: 'model', label: 'Modelo' },
      { key: 'capacity', label: 'Capacidad' },
      { key: 'status', label: 'Estado' },
    ],
    title: 'Reporte de Vehículos',
    mapRow: (r) => ({
      id_vehicle: r.id_vehicle,
      plate: r.plate,
      brand: r.brand || '',
      model: r.model || '',
      capacity: r.capacity,
      status: r.status || '',
    }),
  },
  destinos: {
    model: destinationsModel,
    include: [
      {
        model: MunicipalityModel,
        include: [StateModel],
      },
    ],
    fields: [
      { key: 'id_destination', label: 'ID' },
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
      { key: 'Municipality.name', label: 'Municipio' },
      { key: 'Municipality.State.name', label: 'Estado' },
    ],
    title: 'Reporte de Destinos',
    mapRow: (r) => ({
      id_destination: r.id_destination,
      name: r.name || '',
      description: r.description,
      'Municipality.name': r.Municipality?.name || '',
      'Municipality.State.name': r.Municipality?.State?.name || '',
    }),
  },
  paquetes: {
    model: packagesModel,
    include: [{ model: VehiclesModel, attributes: ['plate', 'brand', 'model'] }],
    fields: [
      { key: 'id_package', label: 'ID' },
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
      { key: 'departure_date', label: 'Fecha Salida' },
      { key: 'return_date', label: 'Fecha Regreso' },
      { key: 'price', label: 'Precio' },
      { key: 'available_places', label: 'Lugares' },
      { key: 'Vehicle.plate', label: 'Vehículo' },
    ],
    title: 'Reporte de Paquetes',
    mapRow: (r) => ({
      id_package: r.id_package,
      name: r.name,
      description: r.description || '',
      departure_date: r.departure_date,
      return_date: r.return_date,
      price: r.price,
      available_places: r.available_places ?? '',
      'Vehicle.plate': r.Vehicle?.plate || '',
    }),
  },
  reservas: {
    model: reservationsModel,
    include: [
      { model: packagesModel, attributes: ['name'] },
      { model: customersModel, attributes: ['name', 'email'] },
    ],
    fields: [
      { key: 'id_reservation', label: 'ID' },
      { key: 'Package.name', label: 'Paquete' },
      { key: 'Customer.name', label: 'Cliente' },
      { key: 'Customer.email', label: 'Email Cliente' },
      { key: 'reservation_date', label: 'Fecha Reserva' },
      { key: 'pay_state', label: 'Estado Pago' },
    ],
    title: 'Reporte de Reservas',
    mapRow: (r) => ({
      id_reservation: r.id_reservation,
      'Package.name': r.Package?.name || '',
      'Customer.name': r.Customer?.name || '',
      'Customer.email': r.Customer?.email || '',
      reservation_date: r.reservation_date,
      pay_state: r.pay_state,
    }),
  },
};

function resolveNestedValue(obj, path) {
  if (obj && obj[path] !== undefined) return obj[path];
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ''), obj);
}

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('es-ES');
}

function formatValue(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date || (typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val)))) {
    return formatDate(val);
  }
  if (typeof val === 'number') {
    return Number.isInteger(val) ? String(val) : val.toFixed(2);
  }
  return String(val);
}

function generatePDF(rows, config, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${config.title.toLowerCase().replace(/\s+/g, '_')}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).font('Helvetica-Bold').text(config.title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(8).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-ES')}`, { align: 'right' });
  doc.moveDown();

  const columns = config.fields.map((f) => ({ header: f.label, key: f.key }));
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columns.length;

  const drawHeader = () => {
    const y = doc.y;
    doc.fontSize(7).font('Helvetica-Bold');
    columns.forEach((col, i) => {
      const x = doc.page.margins.left + i * colWidth;
      doc.rect(x, y, colWidth, 14).fill('#2563eb');
      doc.fillColor('#ffffff').text(col.header, x + 2, y + 3, { width: colWidth - 4, align: 'left' });
      doc.fillColor('#000000');
    });
    doc.y = y + 14;
  };

  const drawRow = (row, isEven) => {
    const y = doc.y;
    if (y + 14 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawHeader();
    }
    const yy = doc.y;
    if (isEven) {
      doc.rect(doc.page.margins.left, yy, pageWidth, 13).fill('#f1f5f9');
    }
    doc.fillColor('#000000').fontSize(6).font('Helvetica');
    columns.forEach((col, i) => {
      const x = doc.page.margins.left + i * colWidth;
      const val = resolveNestedValue(row, col.key);
      doc.text(formatValue(val), x + 2, yy + 1, { width: colWidth - 4, align: 'left' });
    });
    doc.y = yy + 13;
  };

  drawHeader();
  rows.forEach((row, idx) => drawRow(row, idx % 2 === 0));
  doc.end();
}

function generateTXT(rows, config, res) {
  const separator = ' | ';
  const headers = config.fields.map((f) => f.label);
  const divider = headers.map(() => '-'.repeat(20)).join(separator);

  let lines = [];
  lines.push(config.title);
  lines.push('='.repeat(config.title.length));
  lines.push(`Generado: ${new Date().toLocaleString('es-ES')}`);
  lines.push('');
  lines.push(headers.join(separator));
  lines.push(divider);

  rows.forEach((row) => {
    const vals = config.fields.map((f) => formatValue(resolveNestedValue(row, f.key)).padEnd(20));
    lines.push(vals.join(separator));
  });

  lines.push('');
  lines.push(`Total de registros: ${rows.length}`);

  const content = lines.join('\r\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${config.title.toLowerCase().replace(/\s+/g, '_')}.txt"`);
  res.send(content);
}

async function generateExcel(rows, config, res) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AndesTur Panel';
  const sheet = workbook.addWorksheet(config.title);

  sheet.columns = config.fields.map((f) => ({
    header: f.label,
    key: f.key,
    width: Math.max(f.label.length + 5, 15),
  }));

  rows.forEach((row) => {
    sheet.addRow(
      config.fields.reduce((acc, f) => {
        const val = resolveNestedValue(row, f.key);
        acc[f.key] = val instanceof Date ? val : formatValue(val);
        return acc;
      }, {})
    );
  });

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

  const buf = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${config.title.toLowerCase().replace(/\s+/g, '_')}.xlsx"`);
  res.send(Buffer.from(buf));
}

export const exportData = async (req, res, next) => {
  try {
    const { module: moduleName, format } = req.params;
    const config = MODULES[moduleName];

    if (!config) {
      return res.status(404).json({ message: `Módulo "${moduleName}" no encontrado` });
    }
    if (!['pdf', 'txt', 'excel'].includes(format)) {
      return res.status(400).json({ message: `Formato "${format}" no soportado. Use: pdf, txt, excel` });
    }

    const data = await config.model.findAll({
      include: config.include.length > 0 ? config.include : undefined,
      order: [[config.fields[0].key.split('.')[0] || config.fields[0].key, 'ASC']],
    });

    const rows = data.map(config.mapRow);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No hay datos para exportar' });
    }

    switch (format) {
      case 'pdf':
        generatePDF(rows, config, res);
        break;
      case 'txt':
        generateTXT(rows, config, res);
        break;
      case 'excel':
        await generateExcel(rows, config, res);
        break;
    }
  } catch (err) {
    next(err);
  }
};
