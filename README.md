# 📋 Reporte de Eventos de Riesgo — Guía de instalación

Sistema web para reportar eventos de riesgo institucional. Incluye formulario público, notificación automática por correo y panel de administración protegido.

---

## 🗂 Estructura del proyecto

```
riesgo-app/
├── backend/
│   ├── server.js              ← Servidor principal Express
│   ├── routes/
│   │   ├── reportes.js        ← POST /api/reportes
│   │   ├── auth.js            ← POST /api/auth/request|verify
│   │   └── admin.js           ← GET  /api/admin/stats|export
│   ├── middleware/
│   │   ├── auth.js            ← Validación JWT
│   │   └── validate.js        ← Validación del formulario
│   └── utils/
│       ├── storage.js         ← Persistencia JSON
│       ├── excel.js           ← Generación de Excel
│       └── mailer.js          ← Envío de correos
├── frontend/
│   ├── index.html             ← Formulario público
│   ├── pages/
│   │   └── admin.html         ← Panel de administración
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── form.js            ← Lógica del formulario
│       └── admin.js           ← Lógica del panel admin
├── data/
│   └── reportes.json          ← Se crea automáticamente
├── .env.example               ← Plantilla de configuración
├── .env                       ← TU configuración (no subir a git)
└── package.json
```

---

## ⚙️ Instalación paso a paso

### 1. Requisitos previos

- **Node.js** v18 o superior → [nodejs.org](https://nodejs.org)
- Una cuenta de **Gmail** (u otro proveedor SMTP)

### 2. Clonar o descargar el proyecto

```bash
# Si tienes git:
git clone <url-del-repositorio> riesgo-app
cd riesgo-app

# O descomprime el ZIP y entra a la carpeta
cd riesgo-app
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar el archivo `.env`

Copia la plantilla y edítala:

```bash
cp .env.example .env
```

Abre `.env` con cualquier editor de texto y completa:

```env
PORT=3000

# ── Correo que ENVÍA las notificaciones ──────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   ← Contraseña de aplicación Gmail (ver abajo)

# ── Correo que RECIBE cada reporte ───────────────────────────
DEST_EMAIL=riesgos@tucolegio.edu.co

# ── Correos que pueden entrar al panel admin ──────────────────
ADMIN_EMAILS=admin@tucolegio.edu.co,rector@tucolegio.edu.co

# ── Clave secreta para los tokens (cámbiala) ─────────────────
JWT_SECRET=pon_aqui_algo_largo_y_aleatorio_minimo_32_caracteres

# ── Nombre del colegio (aparece en correos) ───────────────────
SCHOOL_NAME=Colegio San José
```

### 5. Configurar Gmail para envío de correos

Gmail requiere una **Contraseña de aplicación** (diferente a tu contraseña normal):

1. Ve a [myaccount.google.com/security](https://myaccount.google.com/security)
2. Activa la **verificación en dos pasos** (si no la tienes)
3. Busca **"Contraseñas de aplicaciones"**
4. Crea una nueva → selecciona "Correo" y "Otro (nombre personalizado)" → escribe "Riesgos Colegio"
5. Google te dará una clave de 16 caracteres tipo `xxxx xxxx xxxx xxxx`
6. Copia esa clave en `SMTP_PASS` del archivo `.env`

> **¿Usas Outlook/Office 365?**
> Cambia `SMTP_HOST=smtp.office365.com` y `SMTP_PORT=587`

### 6. Iniciar el servidor

```bash
npm start
```

Verás en la consola:
```
✅ Servidor corriendo en http://localhost:3000
📋 Formulario: http://localhost:3000
🔒 Panel admin: http://localhost:3000/admin
```

---

## 🌐 Compartir el formulario por link

### Opción A — Red local (intranet del colegio)

Si el computador donde corre el servidor está en la misma red WiFi que los demás:

```bash
# Encuentra la IP local del servidor
# En Windows:
ipconfig

# En Mac/Linux:
ifconfig | grep "inet "
```

El link para compartir sería algo como:
`http://192.168.1.45:3000`

### Opción B — Internet (acceso desde cualquier lugar)

Para que el formulario sea accesible desde fuera del colegio, usa uno de estos servicios gratuitos:

#### Render.com (recomendado — gratis)
1. Crea cuenta en [render.com](https://render.com)
2. "New Web Service" → conecta tu repositorio de GitHub
3. En variables de entorno, agrega todas las del `.env`
4. Render te dará una URL tipo `https://riesgo-colegio.onrender.com`

#### Railway.app (también gratis)
1. [railway.app](https://railway.app) → "New Project" → "Deploy from GitHub"
2. Agrega las variables de entorno
3. URL automática tipo `https://riesgo-xxx.railway.app`

#### ngrok (para pruebas rápidas)
```bash
# Instala ngrok: https://ngrok.com
ngrok http 3000
# Te da un link temporal tipo https://abc123.ngrok.io
```

---

## 🔒 Panel de administración

**URL:** `http://localhost:3000/admin` (o tu dominio `/admin`)

### Cómo funciona el acceso:
1. El administrador ingresa su correo institucional
2. El sistema verifica que esté en la lista `ADMIN_EMAILS`
3. Si está habilitado, llega un código de 6 dígitos a su correo (válido 15 min)
4. Ingresa el código → accede al panel
5. La sesión dura 8 horas

### El panel muestra:
- Total de eventos registrados
- Eventos críticos (gravedad 4–5)
- Distribución por gravedad y por gestión
- Últimos eventos registrados
- Botón para descargar el Excel completo

---

## 📧 Flujo del correo automático

Cada vez que alguien envía el formulario:
1. El evento se guarda en `data/reportes.json`
2. Se genera un Excel con **todos** los reportes hasta la fecha
3. Se envía un correo a `DEST_EMAIL` con:
   - Resumen del evento en el cuerpo del correo
   - Excel completo como archivo adjunto

---

## 📁 Sobre los datos

Los datos se guardan en `data/reportes.json`. Este archivo:
- Se crea automáticamente la primera vez
- Nunca se borra automáticamente
- Puedes hacer backup simplemente copiando el archivo
- Si migras de servidor, copia `data/reportes.json` al nuevo servidor

---

## 🛡 Seguridad implementada

| Medida | Descripción |
|--------|-------------|
| Rate limiting | Máx. 10 envíos por IP cada 15 min en el formulario |
| Validación servidor | Todos los campos se validan en backend (no solo en frontend) |
| JWT con expiración | Tokens de admin válidos 8 horas |
| Código OTP | Acceso admin por código de un solo uso, expira en 15 min |
| Helmet.js | Headers HTTP de seguridad |
| Tamaño de payload | Limitado a 10KB para prevenir ataques |
| Sin exposición de datos | Los reportes no son accesibles sin autenticación |

---

## ❓ Preguntas frecuentes

**¿Se pueden agregar más administradores?**
Sí, simplemente agrega más correos separados por coma en `ADMIN_EMAILS`.

**¿Qué pasa si el correo SMTP falla?**
El reporte igual se guarda en `reportes.json`. El error aparece en la consola del servidor. Los admins pueden descargar el Excel desde el panel.

**¿Se pueden ver los reportes sin descargar el Excel?**
Sí, el panel muestra los últimos 8 eventos. Para ver todos, descarga el Excel.

**¿Cómo hago backup de los datos?**
Copia el archivo `data/reportes.json` a un lugar seguro. Puedes importarlo de vuelta simplemente reemplazando el archivo.

**¿Puedo cambiar el nombre del colegio?**
Sí, cambia `SCHOOL_NAME` en el archivo `.env` y reinicia el servidor.
