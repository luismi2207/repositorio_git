# Publicar VetLuna con HTTPS

El proyecto está preparado para un servidor Node.js 24 o un contenedor Docker. No se ha publicado todavía: hace falta una cuenta de alojamiento autorizada.

## Render

1. Sube el código a tu repositorio GitHub, sin incluir `data/` ni contraseñas, y conecta ese repositorio a un nuevo **Web Service** en Render.
2. Selecciona Docker como entorno. El Dockerfile está en la raíz del proyecto. Si la raíz del repositorio contiene otras carpetas, selecciona la carpeta de VetLuna como directorio raíz.
3. Configura un disco persistente en `/app/data`. El plan y el disco pueden tener coste; revisa el precio antes de contratar. Si utilizas otra ubicación, configura `DB_PATH` con la ruta completa al archivo SQLite en ese disco.
4. Define `ADMIN_PASSWORD` en el panel seguro de variables del proveedor antes del primer despliegue. Usa una contraseña nueva y única. No utilices la contraseña de la demostración. La contraseña solo se aplica al crear la primera cuenta; no modifica una base existente.
5. El contenedor define `COOKIE_SECURE=true`. Conserva esa configuración. Render proporciona la dirección pública HTTPS y debe reenviar tráfico al puerto indicado por `PORT`.
6. Publica y abre la dirección HTTPS en el navegador. Verifica el inicio de sesión, crea un registro de prueba y comprueba que se conserva después de reiniciar el servicio. Elimina ese registro al terminar.
7. Configura copias de seguridad del archivo SQLite y comprueba la restauración antes de introducir información real.

El paquete de despliegue no incluye los datos ni la cuenta del entorno de demostración. Se crean datos de ejemplo al inicializar la base nueva. Las sesiones se cierran al reiniciar el servidor.

## Otro servidor

Puedes ejecutar `npm start` con Node.js 24 y colocar un proxy HTTPS delante del puerto de la aplicación. Configura `COOKIE_SECURE=true`, almacenamiento persistente para `data/` y un administrador inicial mediante `ADMIN_PASSWORD`. El contenedor funciona de la misma forma con un volumen escribible por el usuario `node` (UID 1000) montado en `/app/data`.

La aplicación contiene una sola cuenta administradora y registros internos de cobros; no incluye facturación electrónica, roles ni auditoría. Revisa README.md para el alcance antes de habilitarla a usuarios reales.
