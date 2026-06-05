let mysql;

try {
  mysql = require('mysql2/promise');
} catch (error) {
  console.error('Falta la dependencia mysql2. Instalacion sugerida: npm install mysql2');
  process.exit(1);
}

const CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurante',
  checkIntervalMs: Number(process.env.CHECK_INTERVAL_MS || 30000),
  minutesSinceCreation: Number(process.env.MINUTES_SINCE_CREATION || 2),
};

const REQUIRED_COLUMNS = [
  'id',
  'id_item',
  'cantidad',
  'entregado',
  'id_pedido',
  'id_persona',
  'fecha_creacion',
];

let isChecking = false;

function formatDate(value) {
  if (!value) {
    return 'sin fecha';
  }

  return value instanceof Date ? value.toISOString() : String(value);
}

async function verifyListaPedidoColumns(connection) {
  const [columns] = await connection.execute(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    ['lista_pedido']
  );

  const columnNames = new Set(columns.map((column) => column.COLUMN_NAME));
  const missingColumns = REQUIRED_COLUMNS.filter((columnName) => !columnNames.has(columnName));

  if (missingColumns.length > 0) {
    throw new Error(
      `Faltan columnas en lista_pedido: ${missingColumns.join(', ')}`
    );
  }
}

async function findPendingOrders(connection) {
  const [rows] = await connection.execute(
    `
      SELECT
        id,
        id_item,
        cantidad,
        entregado,
        id_pedido,
        id_persona,
        fecha_creacion
      FROM lista_pedido
      WHERE entregado = FALSE
        AND fecha_creacion <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
      ORDER BY fecha_creacion ASC
    `,
    [CONFIG.minutesSinceCreation]
  );

  return rows;
}

function handlePendingOrders(pendingOrders) {
  if (pendingOrders.length === 0) {
    console.log(`[${new Date().toISOString()}] No hay pedidos pendientes antiguos.`);
    return;
  }

  console.log(
    `[${new Date().toISOString()}] Pedidos pendientes con ${CONFIG.minutesSinceCreation} minutos o mas: ${pendingOrders.length}`
  );

  pendingOrders.forEach((order) => {
    console.log(
      [
        `  - lista_pedido.id=${order.id}`,
        `id_pedido=${order.id_pedido}`,
        `id_item=${order.id_item}`,
        `id_persona=${order.id_persona}`,
        `cantidad=${order.cantidad}`,
        `fecha_creacion=${formatDate(order.fecha_creacion)}`,
      ].join(' | ')
    );
  });
}

async function markPendingOrdersAsDelivered(connection) {
  const [result] = await connection.execute(
    `
      UPDATE lista_pedido
      SET entregado = TRUE
      WHERE entregado = FALSE
        AND fecha_creacion <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
    `,
    [CONFIG.minutesSinceCreation]
  );

  return result.affectedRows;
}

async function checkPendingOrders(connection) {
  if (isChecking) {
    return;
  }

  isChecking = true;

  try {
    await connection.beginTransaction();

    const pendingOrders = await findPendingOrders(connection);
    handlePendingOrders(pendingOrders);

    if (pendingOrders.length > 0) {
      const updatedRows = await markPendingOrdersAsDelivered(connection);
      console.log(
        `[${new Date().toISOString()}] Registros actualizados a entregado=true: ${updatedRows}`
      );
    }

    await connection.commit();
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(`[${new Date().toISOString()}] Error deshaciendo la transaccion:`, rollbackError.message);
    }

    console.error(`[${new Date().toISOString()}] Error comprobando lista_pedido:`, error.message);
  } finally {
    isChecking = false;
  }
}

async function main() {
  const connection = await mysql.createConnection({
    host: CONFIG.host,
    port: CONFIG.port,
    user: CONFIG.user,
    password: CONFIG.password,
    database: CONFIG.database,
    dateStrings: false,
  });

  await verifyListaPedidoColumns(connection);

  console.log(
    `Actualizando lista_pedido cada ${CONFIG.checkIntervalMs} ms para marcar como entregados los registros de hace ${CONFIG.minutesSinceCreation} minutos o mas.`
  );

  await checkPendingOrders(connection);
  const intervalId = setInterval(() => checkPendingOrders(connection), CONFIG.checkIntervalMs);

  async function shutdown(signal) {
    clearInterval(intervalId);
    await connection.end();
    console.log(`Proceso detenido por ${signal}. Conexion cerrada.`);
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('No se pudo iniciar el comprobador de pedidos pendientes:', error.message);
  process.exit(1);
});
