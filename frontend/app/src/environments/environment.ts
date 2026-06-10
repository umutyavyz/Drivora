// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Capacitor } from '@capacitor/core';

// Native (iOS/Android) derlemede cihazın WebView'i `capacitor://localhost`
// üzerinden çalışır; bu yüzden `localhost:3000` telefonun KENDİSİNE gider ve
// backend bulunmaz (ayrıca iOS ATS düz http'yi engeller). Bu yüzden native'de
// yayınlanmış Railway backend'ine (HTTPS) bağlanıyoruz.
// Tarayıcıda (web dev) ise her zamanki gibi yerel backend'e (localhost:3000) git.
const RAILWAY_API = 'https://drivora-production-9bca.up.railway.app';

export const environment = {
  production: false,
  API_BASE: Capacitor.isNativePlatform()
    ? RAILWAY_API
    : `http://${window.location.hostname}:3000`
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
