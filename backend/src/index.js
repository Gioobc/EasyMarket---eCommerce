'use strict';

require('dotenv').config();

const { createServer } = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const app = require('./app');
const config = require('./config/env');
const { connectDB, mongoose } = require('./config/db');
const stockEmitter = require('./services/stockEmitter');
const User = require('./models/User');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  socket.on('join_product', (productId) => socket.join(`product_${productId}`));
  socket.on('leave_product', (productId) => socket.leave(`product_${productId}`));
});

stockEmitter.on('stock_update', ({ productId, stock }) => {
  io.to(`product_${productId}`).emit('stock_updated', { productId, stock });
});

const ensureAdmin = async () => {
  const { email, password } = config.admin;
  if (!email || !password) return;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    if (exists.role !== 'admin') {
      await User.updateOne({ _id: exists._id }, { role: 'admin' });
      console.log(`[admin] Rol actualizado a admin: ${email}`);
    }
    return;
  }
  const hashed = await bcrypt.hash(password, config.bcrypt.saltRounds);
  await User.create({ name: 'Administrador', email: email.toLowerCase(), password: hashed, role: 'admin' });
  console.log(`[admin] Usuario administrador creado: ${email}`);
};

const start = async () => {
  try {
    await connectDB();
    await ensureAdmin();

    httpServer.listen(config.port, () => {
      console.log(`EasyMarket backend en http://localhost:${config.port} [${config.env}]`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} recibido. Cerrando...`);
      httpServer.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
};

start();
