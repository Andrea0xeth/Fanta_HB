# Unregister Service Worker - Quick Fix

## Steps to Fix Certificate Error

### 1. Unregister Service Worker in Browser

**IMPORTANTE: Esegui questo codice nella CONSOLE DEL BROWSER, NON nel terminale!**

#### Passo 1: Apri la Console del Browser
1. Apri la pagina con l'errore del certificato nel browser (es. `https://localhost:5173`)
2. Apri gli Strumenti per Sviluppatori:
   - **Su Mac**: Premi `Cmd + Option + I` (oppure `Cmd + Option + J`)
   - **Su Windows/Linux**: Premi `F12` oppure `Ctrl + Shift + I`
3. Vai alla tab **"Console"** (dovrebbe essere già aperta)

#### Passo 2: Copia e Incolla questo Codice
Nella console del browser (dove vedi i messaggi di errore), copia e incolla tutto questo codice e premi **Invio**:

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => {
    reg.unregister().then(() => console.log('✅ Service worker unregistered'));
  });
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => {
    caches.delete(name).then(() => console.log('✅ Cache deleted:', name));
  });
});

// Ricarica la pagina dopo 1 secondo
setTimeout(() => {
  console.log('🔄 Ricaricando la pagina...');
  location.reload();
}, 1000);
```

Dovresti vedere messaggi come `✅ Service worker unregistered` nella console.

### 2. Clear Browser Storage

In DevTools:
- Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
- Click **Clear site data** or manually clear:
  - Service Workers
  - Cache Storage
  - Local Storage

### 3. Restart Dev Server

Stop the current server (Ctrl+C) and restart:
```bash
pnpm dev
```

### 4. Trust the Certificate

When you see the certificate warning:
- Click **"Trust Certificate"**
- Check **"Remember for this workspace"** if available

The certificate is self-signed (normal for local development) and safe to trust.

