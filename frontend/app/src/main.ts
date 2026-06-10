import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { pageTransitionAnimation } from './app/animations/page-transition';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';

const native = Capacitor.isNativePlatform();

// Native uygulamada (APK/IPA) service worker'a gerek yok ve zararlı:
// app bundle'ını cache'leyip her güncellemede ESKİ kodu sunar.
// Daha önce kayıtlı bir SW + cache varsa temizle ki cihaz güncel kodu çalıştırsın.
if (native && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(rs => rs.forEach(r => r.unregister()))
    .catch(() => {});
  if ('caches' in window) {
    caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {});
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'ios',
      animated: true,
      navAnimation: pageTransitionAnimation
    }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      // Native'de KAPALI; yalnızca gerçek web PWA'da aktif.
      enabled: !isDevMode() && !native,
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
});