# Aplicación eCommerce Mobile con Expo Go y Backend Node.js/Express

---

## Características

- 🛍️ **Catálogo de Productos** — Explora productos con búsqueda, filtros por categoría y ordenamiento
- 🛒 **Carrito de Compras** — Agrega productos, actualiza cantidades y elimina artículos
- 👤 **Gestión de Cuenta** — Registro, inicio de sesión y edición de perfil (nombre, teléfono, dirección y contraseña)
- 📦 **Historial de Compras** — Consulta pedidos anteriores con vista detallada
- 🔒 **Autenticación** — Autenticación basada en JWT con almacenamiento seguro de tokens

---

## Estructura del Proyecto

```
EasyMarket/
├── backend/          # API REST con Node.js + Express
│   └── src/
│       ├── routes/   # auth, products, cart, orders
│       ├── middleware/
│       └── data/     # Almacenamiento basado en archivos JSON
└── frontend/         # Aplicación Expo (React Native)
    ├── app/
    │   ├── (tabs)/   # Pestañas Home, Cart, History y Profile
    │   ├── auth/     # Pantallas de Login y Register
    │   ├── product/  # Pantalla de detalle de producto
    │   └── order/    # Pantalla de detalle de pedido
    ├── components/   # Componentes reutilizables de UI
    ├── context/      # AuthContext, CartContext
    ├── services/     # Cliente API
    └── constants/    # Colors, etc.
```

---

## Primeros Pasos

### 1. Iniciar el Backend

```bash
cd backend
npm install
npm start
# Ejecuta en http://localhost:3001
```

### 2. Iniciar el Frontend

```bash
cd frontend
npm install
npm start
# Escanea el código QR con la aplicación Expo Go
```

> **Nota:** Si ejecutas la aplicación en un dispositivo físico, actualiza `API_BASE` en `frontend/services/api.ts`
> para usar la dirección IP local de tu máquina (por ejemplo: `http://192.168.1.X:3001/api`).

---

## Endpoints de la API Backend

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Registrar un nuevo usuario |
| POST | `/api/auth/login` | — | Iniciar sesión y recibir JWT |
| GET | `/api/auth/profile` | ✅ | Obtener el perfil del usuario actual |
| PUT | `/api/auth/profile` | ✅ | Actualizar perfil o contraseña |
| GET | `/api/products` | — | Listar productos (búsqueda, filtro y ordenamiento) |
| GET | `/api/products/categories` | — | Listar categorías |
| GET | `/api/products/:id` | — | Obtener detalle del producto |
| GET | `/api/cart` | ✅ | Obtener el carrito actual |
| POST | `/api/cart/items` | ✅ | Agregar producto al carrito |
| PUT | `/api/cart/items/:productId` | ✅ | Actualizar cantidad de un producto |
| DELETE | `/api/cart/items/:productId` | ✅ | Eliminar producto del carrito |
| DELETE | `/api/cart` | ✅ | Vaciar el carrito |
| POST | `/api/orders/checkout` | ✅ | Realizar pedido desde el carrito |
| GET | `/api/orders` | ✅ | Obtener historial de compras |
| GET | `/api/orders/:id` | ✅ | Obtener detalle del pedido |

---
