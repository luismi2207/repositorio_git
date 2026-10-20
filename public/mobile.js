let installPrompt;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function hideInstall() { document.querySelector('#mobile-install')?.remove(); }
function showInstall() {
  if (standalone() || document.querySelector('#mobile-install')) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!installPrompt && !ios) return;
  const banner = document.createElement('section');
  banner.id = 'mobile-install';
  banner.setAttribute('aria-label', 'Instalar VetLuna');
  banner.innerHTML = '<img src="/logo.svg" alt=""><div><strong>VetLuna en tu celular</strong><small>' + (ios ? 'En Safari: Compartir → Añadir a pantalla de inicio.' : 'Accede a tu clínica desde la pantalla de inicio.') + '</small></div>' + (!ios ? '<button class="primary" id="install-now">Instalar</button>' : '') + '<button id="dismiss-install" aria-label="Cerrar aviso">×</button>';
  document.body.append(banner);
  document.querySelector('#dismiss-install').onclick = hideInstall;
  const button = document.querySelector('#install-now');
  if (button) button.onclick = async () => { if (!installPrompt) return; await installPrompt.prompt(); const result = await installPrompt.userChoice; installPrompt = null; hideInstall(); };
}
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; showInstall(); });
window.addEventListener('appinstalled', hideInstall);
window.addEventListener('offline', () => toast('Sin conexión. Conéctate para consultar y guardar los registros.'));
window.addEventListener('online', () => toast('Conexión restablecida.'));
if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => console.warn('No se pudo activar la instalación móvil.'));
showInstall();
