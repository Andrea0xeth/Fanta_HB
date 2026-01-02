#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { networkInterfaces } from 'os'

// Trova l'IP locale sulla rete
function getLocalIP() {
  const interfaces = networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Ignora loopback e non-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return null
}

// Verifica se mkcert è installato
function checkMkcert() {
  try {
    execSync('mkcert -version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Genera i certificati
function generateCertificates() {
  const mkcertDir = join(process.cwd(), 'mkcert')
  const certFile = join(mkcertDir, 'localhost+2.pem')
  const keyFile = join(mkcertDir, 'localhost+2-key.pem')

  // Crea directory se non esiste
  if (!existsSync(mkcertDir)) {
    mkdirSync(mkcertDir, { recursive: true })
  }

  // Se i certificati esistono già, chiedi conferma
  if (existsSync(certFile) && existsSync(keyFile)) {
    console.log('⚠️  I certificati mkcert esistono già.')
    console.log('   Se vuoi rigenerarli, elimina prima la directory mkcert/')
    return
  }

  // Trova IP locale
  const localIP = getLocalIP()
  const hosts = ['localhost', '127.0.0.1', '::1']
  
  if (localIP) {
    hosts.push(localIP)
    console.log(`📍 Trovato IP locale: ${localIP}`)
    console.log(`   I certificati includeranno questo IP per accesso da mobile`)
  } else {
    console.log('⚠️  IP locale non trovato. I certificati funzioneranno solo su localhost')
    console.log('   Per accedere da mobile, aggiungi manualmente il tuo IP:')
    console.log('   mkcert -key-file mkcert/localhost+2-key.pem \\')
    console.log('          -cert-file mkcert/localhost+2.pem \\')
    console.log('          localhost 127.0.0.1 ::1 <TUO_IP>')
  }

  console.log('\n🔐 Generazione certificati mkcert...\n')

  try {
    const hostsStr = hosts.join(' ')
    execSync(
      `mkcert -key-file ${keyFile} -cert-file ${certFile} ${hostsStr}`,
      { stdio: 'inherit' }
    )
    console.log('\n✅ Certificati generati con successo!')
    console.log(`   Certificato: ${certFile}`)
    console.log(`   Chiave: ${keyFile}`)
    console.log('\n🚀 Ora puoi avviare il dev server con: pnpm dev')
    console.log('   Su mobile, accedi a: https://' + (localIP || 'localhost') + ':5173')
  } catch (error) {
    console.error('\n❌ Errore durante la generazione dei certificati:', error.message)
    process.exit(1)
  }
}

// Main
console.log('🔐 Setup mkcert per HTTPS trusted\n')

if (!checkMkcert()) {
  console.error('❌ mkcert non è installato!')
  console.error('\n📦 Installa mkcert:')
  console.error('   macOS:   brew install mkcert')
  console.error('   Linux:   sudo apt install libnss3-tools && wget ...')
  console.error('   Windows: choco install mkcert')
  console.error('\n📖 Vedi SETUP_MKCERT.md per istruzioni dettagliate')
  process.exit(1)
}

// Verifica che la CA sia installata
try {
  execSync('mkcert -CAROOT', { stdio: 'ignore' })
} catch {
  console.log('⚠️  La CA (Certificate Authority) di mkcert non è installata.')
  console.log('   Eseguendo: mkcert -install\n')
  try {
    execSync('mkcert -install', { stdio: 'inherit' })
    console.log('✅ CA installata con successo!\n')
  } catch (error) {
    console.error('❌ Errore durante l\'installazione della CA:', error.message)
    console.error('   Esegui manualmente: mkcert -install')
    process.exit(1)
  }
}

generateCertificates()

