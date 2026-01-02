# 🔐 Setup mkcert per HTTPS Trusted su Mobile

## Problema
Chrome mobile (e altri browser mobile) **non accettano facilmente** i certificati self-signed generati da `basicSsl()`. Questo causa errori TLS quando accedi all'app da mobile.

## Soluzione: mkcert
`mkcert` genera certificati **trusted localmente** che funzionano perfettamente su mobile senza errori TLS.

## 📦 Installazione

### macOS
```bash
# Con Homebrew
brew install mkcert

# Installa la CA (Certificate Authority) locale
mkcert -install
```

### Linux
```bash
# Con apt (Debian/Ubuntu)
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/

# Installa la CA locale
mkcert -install
```

### Windows
```bash
# Con Chocolatey
choco install mkcert

# O scarica da: https://github.com/FiloSottile/mkcert/releases
# Poi esegui:
mkcert -install
```

## 🚀 Setup per questo Progetto

### Opzione A: Script Automatico (Consigliato)
```bash
cd apps/web
pnpm setup:mkcert
```

Lo script:
- ✅ Verifica che mkcert sia installato
- ✅ Installa la CA se necessario
- ✅ Trova automaticamente il tuo IP locale
- ✅ Genera i certificati con tutti gli host necessari

### Opzione B: Manuale
```bash
cd apps/web
mkdir -p mkcert

# Genera certificati per localhost e IP locale
mkcert -key-file mkcert/localhost+2-key.pem \
       -cert-file mkcert/localhost+2.pem \
       localhost 127.0.0.1 ::1

# Se vuoi accedere da mobile sulla stessa rete, aggiungi anche il tuo IP locale:
# Prima trova il tuo IP:
# macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
# Esempio: 192.168.1.100
# Poi:
mkcert -key-file mkcert/localhost+2-key.pem \
       -cert-file mkcert/localhost+2.pem \
       localhost 127.0.0.1 ::1 192.168.1.100
```

### 3. Riavvia il dev server
```bash
pnpm dev
```

## ✅ Verifica

1. **Desktop**: Apri `https://localhost:5173` - dovrebbe funzionare senza warning
2. **Mobile**: 
   - Trova l'IP del tuo computer sulla rete locale
   - Apri `https://<IP>:5173` su Chrome mobile
   - **Nessun errore TLS!** 🎉

## 🔍 Troubleshooting

### "mkcert: command not found"
- Assicurati di aver installato mkcert correttamente
- Verifica che sia nel PATH: `which mkcert`

### "Certificate not found"
- Verifica che i file esistano in `apps/web/mkcert/`
- Controlla i nomi: devono essere esattamente `localhost+2.pem` e `localhost+2-key.pem`

### Errore TLS ancora presente su mobile
- Assicurati di aver incluso il tuo IP locale quando hai generato i certificati
- Riavvia il dev server dopo aver generato i certificati
- Su mobile, prova a cancellare cache e dati del sito

### Il certificato non funziona dopo un po'
- I certificati mkcert durano diversi mesi, ma se scadono:
  ```bash
  rm mkcert/*.pem
  mkcert -key-file mkcert/localhost+2-key.pem \
         -cert-file mkcert/localhost+2.pem \
         localhost 127.0.0.1 ::1 <TUO_IP>
  ```

## 📝 Note

- I certificati mkcert sono **trusted solo sul tuo computer** (e dispositivi che hanno la CA installata)
- Per produzione, usa sempre certificati validi (Let's Encrypt, etc.)
- I certificati in `mkcert/` sono già nel `.gitignore` per sicurezza

## 🆘 Fallback

Se mkcert non è disponibile, Vite userà automaticamente `basicSsl()` come fallback. Funzionerà su desktop ma **non su mobile**.

