# VetLuna · Clínica veterinaria

Aplicación web en español para gestionar una clínica veterinaria. Identidad visual verde salvia y crema, logo original en SVG, diseño adaptable a móvil y escritorio.

## Ejecutar

Requiere Node.js 24 o superior. No necesita paquetes externos ni un proceso de compilación.

```sh
cd /workspace/repositorio_git
npm start
```

La aplicación escucha en el puerto 3000. `PORT` permite elegir otro puerto.

En el primer arranque se crea el usuario `admin` con una contraseña aleatoria que se muestra **una sola vez en la consola**. Guarda esa contraseña. Se puede establecer `ADMIN_PASSWORD` mediante una variable de entorno antes del primer arranque; esta variable no cambia cuentas ya creadas. No guardes contraseñas en el código ni en Git.

## Funciones

- Login con contraseña derivada mediante scrypt, cookie HttpOnly, sesión de 8 horas y límite de intentos.
- Panel con indicadores calculados y agenda del día.
- Pacientes y tutores, citas, historial clínico, inventario con alerta de stock mínimo y registro de cobros.
- Creación, edición, eliminación con confirmación y búsqueda en cada sección.
- Persistencia en SQLite en `data/vetluna.sqlite` (excluido de Git).
- Datos iniciales de ejemplo, editables y eliminables. Todos los importes se muestran en soles peruanos.

## Verificación

```sh
npm test
```

Las pruebas utilizan una base de datos temporal y verifican autenticación, operaciones de registros, módulos, rechazo de solicitudes desde otros orígenes y cierre de sesión.

## Datos y alcance

Esta primera versión es para una única cuenta administradora. Los nombres de paciente en citas e historiales se ingresan como texto; no existen todavía relaciones automáticas entre módulos. Los cobros son registros internos: no emiten comprobantes electrónicos ni procesan pagos. Las sesiones se invalidan al reiniciar el servidor.

Antes de usar información real de clientes, configura HTTPS y `COOKIE_SECURE=true`, copias de seguridad de SQLite con una estrategia de restauración probada y los controles de privacidad correspondientes. Roles de empleados, recuperación de contraseña, auditoría, adjuntos, facturación electrónica y despliegue público quedan pendientes para una siguiente etapa.

El logo y el diseño se sirven localmente. Las fuentes de Google son opcionales; se usan fuentes de sistema si no hay conexión.

## Instalar en Android o iPhone

VetLuna es una aplicación web progresiva (PWA), no un APK ni una aplicación publicada en App Store. El servidor debe estar alojado en una dirección HTTPS accesible desde el celular. No basta con copiar el ZIP al teléfono: el proyecto requiere ejecutar Node.js en un servidor y conservar su base SQLite en almacenamiento persistente.

1. En el servidor con Node.js 24+, descomprime el proyecto y ejecuta `npm start`. Configura HTTPS y `COOKIE_SECURE=true` antes de ofrecer acceso externo. Conserva la contraseña inicial del administrador que aparece en la consola del servidor.
2. **Android (Chrome):** abre la dirección HTTPS y pulsa **Instalar** en el aviso de VetLuna o utiliza el menú del navegador → **Instalar aplicación** / **Añadir a pantalla de inicio**.
3. **iPhone (Safari):** abre la dirección HTTPS, pulsa **Compartir** → **Añadir a pantalla de inicio** → **Añadir**.
4. Abre VetLuna desde su icono e inicia sesión.

La aplicación se abre en modo independiente. La interfaz puede cargar sin conexión después de una primera visita, pero el inicio de sesión y la consulta o edición de datos requieren internet. El service worker no almacena respuestas de la API ni datos clínicos en su caché. Las actualizaciones del servidor se descargan al visitar nuevamente la aplicación; cierra y vuelve a abrir la app si hay una versión pendiente de activación.

El ZIP de distribución excluye las bases de datos, contraseñas y datos de la instancia de demostración. En un servidor nuevo se generarán una cuenta administradora y registros de ejemplo nuevos.
