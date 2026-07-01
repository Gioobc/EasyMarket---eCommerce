# EasyMarket — eCommerce

## Requisitos previos
- Node.js 18+
- npm
- Expo Go instalado en tu celular (o emulador Android/iOS)

---

## Backend

```bash
cd backend
npm install
npm start
```

El servidor corre en: `http://localhost:3001`

---

## Frontend

```bash
cd frontend
npm install
npx expo start
```

Luego en la terminal aparece un QR. Escanealo con la app **Expo Go** desde tu celular.

### Otras opciones de arranque

```bash
# Solo para Android (emulador o USB):
npx expo start --android

# Solo para iOS (solo Mac):
npx expo start --ios

# En el navegador web:
npx expo start --web
```

---

## Orden de arranque recomendado

1. Primero levanta el **backend** (`npm run dev`)
2. Luego arranca el **frontend** (`npx expo start`)
3. Abre Expo Go en tu celular y escanea el QR

---

## Generación de APK e IPA con EAS

La app móvil vive en `frontend/` y ya quedó preparada para builds con Expo Application Services.

### Configuración inicial

```bash
cd frontend
npm install
npx eas build:configure
```

Ese primer paso vincula el proyecto con Expo y crea la referencia necesaria para los builds en la nube.

### Configuración de la API para APK

El APK no puede usar `localhost` para llegar al backend. Debes definir la URL real del servidor en `frontend/.env`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.50:3001
```

Usa una IP accesible desde el teléfono o emulador. Si usas un emulador Android, `10.0.2.2` también funciona.

Si cambias esa URL, vuelve a generar el APK con EAS.

### Builds disponibles

```bash
# APK para Android
npm run eas:build:android

# IPA para iOS
npm run eas:build:ios

# Ambos desde el mismo perfil
npm run eas:build:all
```

Los builds usan el perfil `release` definido en `frontend/eas.json`.

### GitHub Actions

El workflow `.github/workflows/eas-build.yml` permite lanzar builds manuales desde GitHub.

Antes de usarlo, crea el secret `EXPO_TOKEN` en el repositorio.
