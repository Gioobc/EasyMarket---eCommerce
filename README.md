# EasyMarket — eCommerce

EasyMarket es una app de comercio electrónico hecha con un backend en Node.js + Express, base de datos MongoDB y una interfaz móvil en Expo/React Native. 📱🛒

## ✨ Funcionalidades

### 👤 Usuario
- Registro e inicio de sesión.
- Perfil editable con cambio de contraseña.
- Catálogo de productos con búsqueda, filtros y ordenamiento.
- Detalle de producto con reseñas, stock y favoritos.
- Lista de deseos.
- Carrito de compras con cálculo de totales.
- Flujo de pago simulado.
- Historial de pedidos y descarga de comprobantes.
- Notificaciones y alertas del usuario.

### 🛠️ Administración
- Panel de administración protegido por rol.
- Estadísticas generales del sistema.
- Gestión de productos.
- Gestión de pedidos y cambio de estado.
- Gestión de usuarios y roles.
- Visualización de inventario y actividad.

### 🔌 Backend
- API REST con Express.
- Persistencia en MongoDB Atlas.
- Autenticación con JWT.
- Gestión de cupones, reseñas, carrito, wishlist, pedidos y recomendaciones.
- Socket.IO para eventos en tiempo real relacionados con stock.

## 🧰 Tecnologías

- Node.js
- Express
- MongoDB y Mongoose
- JWT
- Socket.IO
- Expo / React Native
- TypeScript en el frontend

## 📁 Estructura del proyecto

```text
backend/   -> API, modelos, rutas, servicios y configuración del servidor
frontend/  -> App Expo, pantallas, componentes, contexto y servicios HTTP
```

## ✅ Requisitos previos

- Node.js 18 o superior
- npm
- Cuenta de MongoDB Atlas
- Expo Go en el teléfono si quieres probar sin compilar

## 🚀 Cómo ejecutar el sistema en local

### 1. Instalar dependencias

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Levantar el backend

```bash
cd backend
npm run dev
```

El backend queda disponible en `http://localhost:3001`.

Verifica que responda:

```bash
http://localhost:3001/api/health
```

### 3. Levantar el frontend

```bash
cd frontend
npx expo start
```

Luego escanea el QR con Expo Go. También puedes ejecutar:

```bash
npx expo start --android
npx expo start --ios
npx expo start --web
```

## 📝 Notas rápidas

- Si cambias la URL del backend, debes actualizar `frontend/.env`.
- No subas `.env` al repositorio.
- Para pruebas locales, backend y frontend deben estar corriendo al mismo tiempo.
