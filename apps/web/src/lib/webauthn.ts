/**
 * WebAuthn/Passkey Helper
 * Gestisce la registrazione e il login con passkey su iPhone/Android
 */

export interface PasskeyCredential {
  id: string;
  publicKey: string;
  userId: string;
}

/**
 * Verifica se WebAuthn è supportato dal browser
 * Best practice 2025: supporta sia platform che cross-platform authenticators
 * 
 * IMPORTANTE: WebAuthn funziona su:
 * - HTTPS (produzione)
 * - localhost (sviluppo)
 * - 127.0.0.1 (sviluppo)
 */
export const isWebAuthnSupported = (): boolean => {
  if (typeof window === 'undefined') {
    console.warn('[WebAuthn] window non disponibile (SSR?)');
    return false;
  }
  
  // Log dettagliato per debug (soprattutto su mobile)
  const debugInfo = {
    PublicKeyCredential: typeof window.PublicKeyCredential !== 'undefined',
    credentials: typeof navigator.credentials !== 'undefined',
    isSecureContext: window.isSecureContext,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent,
    isUserVerifyingPlatformAuthenticatorAvailable: typeof window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable === 'function',
    isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent),
  };
  
  console.log('[WebAuthn] 🔍 Debug info:', debugInfo);
  
  // Verifica supporto base - PublicKeyCredential (MUST HAVE)
  if (typeof window.PublicKeyCredential === 'undefined') {
    console.error('[WebAuthn] ❌ PublicKeyCredential non disponibile');
    console.error('[WebAuthn] User Agent:', navigator.userAgent);
    console.error('[WebAuthn] Protocol:', window.location.protocol);
    console.error('[WebAuthn] isSecureContext:', window.isSecureContext);
    return false;
  }
  
  // Verifica supporto per navigator.credentials (MUST HAVE)
  if (typeof navigator === 'undefined' || typeof navigator.credentials === 'undefined') {
    console.error('[WebAuthn] ❌ navigator.credentials non disponibile');
    return false;
  }
  
  // IMPORTANTE: Su Safari iOS, WebAuthn richiede HTTPS (anche su reti locali)
  // Su HTTP, Safari iOS blocca WebAuthn anche se il browser lo supporta
  if (!window.isSecureContext) {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      console.warn('[WebAuthn] ⚠️ Safari iOS richiede HTTPS per WebAuthn');
      console.warn('[WebAuthn] ⚠️ Attualmente su:', window.location.protocol);
      // Non blocchiamo qui, lasciamo che il browser gestisca l'errore
      // Ma loggiamo per debug
    }
  }
  
  console.log('[WebAuthn] ✅ Supporto rilevato - procediamo con la creazione');
  
  return true;
};

/**
 * Verifica se le passkey platform (Face ID/Touch ID) sono disponibili
 */
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;
  
  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Registra una nuova passkey per l'utente
 */
export const registerPasskey = async (
  userId: string,
  username: string,
  displayName: string
): Promise<PasskeyCredential> => {
  // Verifica supporto base (senza bloccare su isSecureContext)
  if (typeof window === 'undefined' || typeof window.PublicKeyCredential === 'undefined') {
    throw new Error('WebAuthn non è supportato su questo browser. Usa Safari su iOS o Chrome su Android.');
  }

  if (typeof navigator === 'undefined' || typeof navigator.credentials === 'undefined') {
    throw new Error('WebAuthn non è supportato su questo browser. Usa Safari su iOS o Chrome su Android.');
  }

  console.log('[WebAuthn] Tentativo creazione passkey per:', { userId, username, displayName });

  try {
    // Genera una challenge casuale (in produzione, questo dovrebbe venire dal server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Best practice 2025: configurazione ottimale per passkey moderne
    // Supporta sia platform (Face ID/Touch ID) che cross-platform (iCloud Keychain)
    // 
    // CAMBIAMENTI CHIAVE rispetto alla versione precedente:
    // 1. Rimosso authenticatorAttachment: 'platform' → permette iCloud Keychain
    // 2. requireResidentKey: true → abilita passkey sincronizzate
    // 3. userVerification: 'preferred' → maggiore compatibilità
    // 4. attestation: 'none' → più veloce e sufficiente per passkey
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: '30diCiaccio Game',
        // rp.id: per localhost usa 'localhost', per produzione usa il dominio
        id: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'localhost'
          : window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: username,
        displayName: displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256 (preferito per passkey)
        { alg: -257, type: 'public-key' }, // RS256 (fallback)
        { alg: -8, type: 'public-key' }, // EdDSA (supporto moderno)
      ],
      authenticatorSelection: {
        // NON specificare authenticatorAttachment per permettere sia platform che cross-platform
        // Questo permette l'uso di iCloud Keychain, Google Password Manager, ecc.
        // authenticatorAttachment: 'platform' sarebbe troppo restrittivo
        userVerification: 'preferred', // 'preferred' invece di 'required' per maggiore compatibilità
        requireResidentKey: true, // true per passkey moderne (resident keys = passkey sincronizzate)
      },
      timeout: 120000, // 2 minuti per dare tempo all'utente
      attestation: 'none', // 'none' è sufficiente per passkey, più veloce
      // Note: Estensioni PRF disponibili in futuro per passkey avanzate
    };

    // Richiedi la creazione della credenziale
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Creazione passkey fallita');
    }

    // Estrai i dati della credenziale
    const response = credential.response as AuthenticatorAttestationResponse;
    
    // Converti i dati in formato base64 per il salvataggio
    const credentialId = Array.from(new Uint8Array(credential.rawId))
      .map(b => String.fromCharCode(b))
      .join('');
    const credentialIdBase64 = btoa(credentialId);

    const publicKey = Array.from(new Uint8Array(response.getPublicKey() || new Uint8Array()))
      .map(b => String.fromCharCode(b))
      .join('');
    const publicKeyBase64 = btoa(publicKey);

    return {
      id: credentialIdBase64,
      publicKey: publicKeyBase64,
      userId,
    };
  } catch (error: any) {
    console.error('Errore registrazione passkey:', error);
    
    // Messaggi di errore più user-friendly e informativi
    if (error.name === 'NotAllowedError') {
      throw new Error('Registrazione annullata. Assicurati di autorizzare l\'uso del sensore biometrico o della passkey.');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('Il tuo browser o dispositivo non supporta le passkey. Prova con Safari su iPhone/iPad o Chrome su Android.');
    } else if (error.name === 'InvalidStateError') {
      throw new Error('Una passkey esiste già per questo account. Usa il login invece della registrazione.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Errore di sicurezza. Assicurati di accedere tramite HTTPS o localhost.');
    } else if (error.name === 'UnknownError') {
      throw new Error('Errore sconosciuto durante la creazione della passkey. Riprova.');
    }
    
    // Messaggio generico con dettagli dell'errore per debug
    throw new Error(`Errore durante la registrazione: ${error.message || error.name || 'Errore sconosciuto'}`);
  }
};

/**
 * Autentica con una passkey esistente
 */
export const authenticateWithPasskey = async (
  credentialId?: string
): Promise<{ credentialId: string; userId: string }> => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn non è supportato su questo dispositivo');
  }

  try {
    // Genera una challenge casuale (in produzione, questo dovrebbe venire dal server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Opzioni per l'autenticazione (best practice 2025)
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 120000, // 2 minuti per dare tempo all'utente
      userVerification: 'preferred', // 'preferred' per maggiore compatibilità
      // rpId: per localhost usa 'localhost', per produzione usa il dominio
      rpId: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'localhost'
        : window.location.hostname,
      // Se abbiamo un credentialId specifico, lo usiamo
      allowCredentials: credentialId 
        ? [{
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: 'public-key',
          }]
        : undefined, // Se non specificato, il browser mostrerà tutte le passkey disponibili (iCloud, Google, ecc.)
      // Note: Estensioni PRF disponibili in futuro per passkey avanzate
    };

    // Richiedi l'autenticazione
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Autenticazione fallita');
    }

    // Estrai l'ID della credenziale
    const credentialIdBase64 = btoa(
      Array.from(new Uint8Array(assertion.rawId))
        .map(b => String.fromCharCode(b))
        .join('')
    );

    // In una vera implementazione, qui invieresti l'assertion al server
    // per verificare la firma e ottenere l'userId associato
    // Per ora, restituiamo il credentialId (il server dovrà fare il lookup)
    
    return {
      credentialId: credentialIdBase64,
      userId: '', // Sarà popolato dal server dopo la verifica
    };
  } catch (error: any) {
    console.error('Errore autenticazione passkey:', error);
    
    // Messaggi di errore più user-friendly e informativi
    if (error.name === 'NotAllowedError') {
      throw new Error('Autenticazione annullata. Assicurati di autorizzare l\'uso del sensore biometrico o della passkey.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('Nessuna passkey trovata. Registrati prima creando un nuovo account.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Errore di sicurezza. Assicurati di accedere tramite HTTPS o localhost.');
    } else if (error.name === 'UnknownError') {
      throw new Error('Errore sconosciuto durante l\'autenticazione. Riprova.');
    }
    
    throw new Error(`Errore durante l'autenticazione: ${error.message || error.name || 'Errore sconosciuto'}`);
  }
};
