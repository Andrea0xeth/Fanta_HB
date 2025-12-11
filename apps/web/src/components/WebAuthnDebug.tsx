import React, { useState, useEffect } from 'react';
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from '../lib/webauthn';

export const WebAuthnDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [platformAvailable, setPlatformAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const info: any = {
      window: typeof window !== 'undefined',
      PublicKeyCredential: typeof window !== 'undefined' ? typeof window.PublicKeyCredential !== 'undefined' : false,
      navigator: typeof navigator !== 'undefined',
      credentials: typeof navigator !== 'undefined' ? typeof navigator.credentials !== 'undefined' : false,
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      isWebAuthnSupported: isWebAuthnSupported(),
    };

    // Verifica platform authenticator
    isPlatformAuthenticatorAvailable().then(available => {
      setPlatformAvailable(available);
    });

    setDebugInfo(info);
  }, []);

  const testWebAuthn = async () => {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const options: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Test',
          id: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'localhost'
            : window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode('test-user'),
          name: 'test@example.com',
          displayName: 'Test User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
        ],
        authenticatorSelection: {
          userVerification: 'preferred',
          requireResidentKey: true,
        },
        timeout: 60000,
        attestation: 'none',
      };

      console.log('Tentativo creazione passkey con opzioni:', options);
      const credential = await navigator.credentials.create({
        publicKey: options,
      });

      console.log('✅ Passkey creata con successo!', credential);
      alert('✅ Passkey creata con successo!');
    } catch (error: any) {
      console.error('❌ Errore creazione passkey:', error);
      alert(`❌ Errore: ${error.name} - ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-dark text-white max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔍 WebAuthn Debug Info</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-bold mb-2">Informazioni Browser/Device:</h3>
          <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-bold mb-2">Platform Authenticator:</h3>
          <p className={platformAvailable === null ? 'text-yellow-400' : platformAvailable ? 'text-green-400' : 'text-red-400'}>
            {platformAvailable === null 
              ? '⏳ Verifica in corso...' 
              : platformAvailable 
                ? '✅ Disponibile (Face ID/Touch ID)' 
                : '❌ Non disponibile'}
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">Test Passkey:</h3>
          <button
            onClick={testWebAuthn}
            className="px-4 py-2 bg-coral-500 rounded hover:bg-coral-600"
          >
            Prova a creare una passkey
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-800 rounded">
          <h3 className="font-bold mb-2">📋 Checklist:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li className={debugInfo.isSecureContext ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.isSecureContext ? '✅' : '❌'} Contesto sicuro (HTTPS/localhost/rete locale)
            </li>
            <li className={debugInfo.PublicKeyCredential ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.PublicKeyCredential ? '✅' : '❌'} PublicKeyCredential disponibile
            </li>
            <li className={debugInfo.credentials ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.credentials ? '✅' : '❌'} navigator.credentials disponibile
            </li>
            <li className={debugInfo.isWebAuthnSupported ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.isWebAuthnSupported ? '✅' : '❌'} WebAuthn supportato (secondo la nostra funzione)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};


