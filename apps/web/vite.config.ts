import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Plugin per iniettare il codice push handler nel service worker generato
const injectPushHandler = () => {
  return {
    name: 'inject-push-handler',
    closeBundle() {
      // Questo viene eseguito dopo che tutti i bundle sono stati generati, incluso il service worker
      const distDir = join(__dirname, 'dist')
      const swPath = join(distDir, 'sw.js')
      const pushHandlerPath = join(__dirname, 'public/sw-push-handler.js')
      
      try {
        const swContent = readFileSync(swPath, 'utf-8')
        const pushHandler = readFileSync(pushHandlerPath, 'utf-8')
        
        // Inietta il codice push handler alla fine del file (prima della chiusura se c'è)
        // Il service worker è minificato, quindi aggiungiamo semplicemente alla fine
        const newContent = swContent + '\n\n' + pushHandler
        writeFileSync(swPath, newContent, 'utf-8')
        console.log('✅ Push handler iniettato nel service worker')
      } catch (err: any) {
        // Se il file non esiste, non fare nulla
        if (err.code !== 'ENOENT') {
          console.warn('⚠️  Could not inject push handler:', err.message)
        }
      }
    }
  }
}

// Funzione per verificare se mkcert è configurato
function getMkcertCertificates() {
  const homeDir = homedir()
  // Percorsi standard per mkcert su macOS/Linux
  const certPaths = [
    join(homeDir, '.local/share/mkcert'),
    join(homeDir, '.mkcert'),
    join(process.cwd(), 'mkcert'),
  ]
  
  for (const certPath of certPaths) {
    const certFile = join(certPath, 'localhost+2.pem')
    const keyFile = join(certPath, 'localhost+2-key.pem')
    
    if (existsSync(certFile) && existsSync(keyFile)) {
      console.log('✅ Trovati certificati mkcert, uso quelli (trusted su mobile)')
      return {
        cert: readFileSync(certFile),
        key: readFileSync(keyFile),
      }
    }
  }
  
  return null
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    // HTTPS RICHIESTO per WebAuthn su Safari iOS
    // Safari iOS blocca WebAuthn su HTTP anche su reti locali
    // 
    // PRIORITÀ:
    // 1. Se mkcert è configurato, usa quei certificati (trusted su mobile)
    // 2. Altrimenti usa basicSsl (self-signed, funziona solo su desktop)
    https: getMkcertCertificates() || {}, // Usa mkcert se disponibile, altrimenti basicSsl
    host: true, // Espone su rete locale
  },
  plugins: [
    react(),
    // Usa basicSsl solo se mkcert non è disponibile
    ...(getMkcertCertificates() ? [] : [basicSsl()]), // Genera certificato SSL self-signed solo se mkcert non c'è
    VitePWA({
      // Usa 'prompt' per permettere all'utente di scegliere quando aggiornare
      // Il nostro hook intercetterà quando c'è un nuovo SW in attesa
      // e mostrerà la notifica per permettere all'utente di aggiornare manualmente
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'DC-30',
        short_name: 'DC-30',
        description: 'Il gioco del 30° compleanno di Di Ciaccio!',
        theme_color: '#FF6B6B',
        background_color: '#1A1A1A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Non saltare automaticamente l'attesa, permette controllo manuale
        skipWaiting: false,
        // Prendi controllo dei client solo quando esplicitamente attivato
        clientsClaim: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
      },
      // Configurazione per sviluppo
      // Disabilitato temporaneamente per evitare errori 500 su dev-sw.js
      // Il service worker funzionerà correttamente in produzione
      devOptions: {
        enabled: false, // Disabilitato per evitare problemi in dev
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
    injectPushHandler(),
  ],
})
