// leaflet.markercluster, kendini global `window.L`'e ekleyerek çalışır.
// esbuild ile üretilen (native/production) bundle'da `leaflet` CommonJS olarak
// yüklendiği için `window.L` otomatik set EDİLMEZ; sonuç olarak eklenti
// `L.markerClusterGroup`'u hiç tanımlamaz ve haritada "is not a function" hatası
// alınır. Bu modül, markercluster import'undan ÖNCE değerlendirilerek window.L'i
// elle atar. (ES modül değerlendirme sırası kaynak sırasına göredir; bu dosya
// map.page.ts içinde 'leaflet.markercluster' import'undan önce import edilmeli.)
import * as L from 'leaflet';

(window as any).L = (window as any).L || L;
