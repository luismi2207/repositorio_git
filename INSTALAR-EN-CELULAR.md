# VetLuna para tu celular

Este paquete contiene una aplicación web instalable (PWA) para Android y iPhone. No es un APK ni se instala descomprimiendo el ZIP en el teléfono.

## Para quien aloje la aplicación

1. Subir el proyecto a un servidor con Node.js 24 o superior y almacenamiento persistente.
2. Ejecutar `npm test` y luego `npm start`.
3. Guardar la contraseña de `admin` que aparece una sola vez en el primer arranque.
4. Asignar una dirección HTTPS y configurar `COOKIE_SECURE=true` al iniciar el servidor.
5. Conservar la carpeta `data` y configurar copias de seguridad. Revisar los límites descritos en README.md antes de ingresar datos reales.
6. Compartir la dirección HTTPS con el dueño de la clínica.

## Android

Abrir la dirección HTTPS en Chrome. Tocar **Instalar** en el aviso o ir al menú de Chrome → **Instalar aplicación** / **Añadir a pantalla de inicio**. Luego abrir el icono VetLuna.

## iPhone

Abrir la dirección HTTPS en Safari. Tocar **Compartir** → **Añadir a pantalla de inicio** → **Añadir**. Luego abrir el icono VetLuna.

El usuario es `admin` y la contraseña es la generada en el servidor. Este archivo no contiene contraseñas. Se necesita conexión para acceder a los datos de la clínica.
