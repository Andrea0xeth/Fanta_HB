import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Register service worker for PWA
// Con registerType: 'prompt', VitePWA non registra automaticamente
// Il nostro hook usePWAUpdate gestirà la registrazione e il rilevamento aggiornamenti
// Non registriamo qui per evitare conflitti - lasciamo che usePWAUpdate gestisca tutto

// Lock screen orientation to portrait (mobile only)
if (typeof window !== 'undefined' && window.screen?.orientation) {
  const orientation = window.screen.orientation as any;
  if (orientation?.lock) {
    // Try to lock orientation to portrait
    orientation.lock('portrait').catch((err: unknown) => {
      // Orientation lock might not be supported or allowed
      // This is normal in some browsers/devices
      console.log('Orientation lock not available:', err);
    });
  }
}

// Prevent rotation on mobile devices
if (typeof window !== 'undefined') {
  // Listen for orientation changes and warn user
  window.addEventListener('orientationchange', () => {
    if (window.orientation === 90 || window.orientation === -90) {
      // Landscape mode - show warning
      console.log('Please rotate to portrait mode');
    }
  });
  
  // Also check on resize (for devices that don't fire orientationchange)
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const currentWidth = window.innerWidth;
    if (currentWidth > lastWidth && window.innerHeight < window.innerWidth) {
      // Likely rotated to landscape
      console.log('Please rotate to portrait mode');
    }
    lastWidth = currentWidth;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
