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
 */
export const isWebAuthnSupported = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.PublicKeyCredential !== 'undefined' &&
         typeof navigator.credentials !== 'undefined';
};

/**
 * Registra una nuova passkey per l'utente
 */
export const registerPasskey = async (
  userId: string,
  username: string,
  displayName: string
): Promise<PasskeyCredential> => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn non è supportato su questo dispositivo');
  }

  try {
    // Genera una challenge casuale (in produzione, questo dovrebbe venire dal server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Crea le opzioni per la registrazione
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: '30diCiaccio Game',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: username,
        displayName: displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Usa il sensore biometrico integrato
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'direct',
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
    
    // Messaggi di errore più user-friendly
    if (error.name === 'NotAllowedError') {
      throw new Error('Registrazione annullata. Riprova e autorizza l\'uso del sensore biometrico.');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('Il tuo dispositivo non supporta le passkey. Usa un dispositivo più recente.');
    } else if (error.name === 'InvalidStateError') {
      throw new Error('Una passkey esiste già per questo account.');
    }
    
    throw new Error(`Errore durante la registrazione: ${error.message || 'Errore sconosciuto'}`);
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

    // Opzioni per l'autenticazione
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId: window.location.hostname,
      // Se abbiamo un credentialId specifico, lo usiamo
      allowCredentials: credentialId 
        ? [{
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: 'public-key',
          }]
        : undefined, // Se non specificato, il browser mostrerà tutte le passkey disponibili
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
    
    // Messaggi di errore più user-friendly
    if (error.name === 'NotAllowedError') {
      throw new Error('Autenticazione annullata. Riprova e autorizza l\'uso del sensore biometrico.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('Nessuna passkey trovata. Registrati prima.');
    }
    
    throw new Error(`Errore durante l'autenticazione: ${error.message || 'Errore sconosciuto'}`);
  }
};
