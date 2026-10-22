// --- Städte, die es gibt ---
const STAEDTE = {
  hamburg: { geojson: hamburgGeoJSON },
  fulda:   { geojson: fuldaGeoJSON }
};

// GeoJSON ([lng, lat]) in Leaflet-Format ([lat, lng]) umwandeln
function ringeAus(geojson) {
  const geom = geojson.features[0].geometry;
  const polygone = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  return polygone.map(p => p[0].map(([lng, lat]) => [lat, lng]));
}

// Pro Stadt Ringe und Grenzen vorberechnen
for (const stadt of Object.values(STAEDTE)) {
  stadt.ringe = ringeAus(stadt.geojson);
  const hauptring = stadt.ringe.reduce((a, b) => (b.length > a.length ? b : a));
  stadt.grenzen = L.polygon(hauptring).getBounds();
}

// --- Karte ---
const map = L.map('map', {
  zoomSnap: 0.25,
  minZoom: 10,
  maxZoom: 19,
  maxBoundsViscosity: 1.0
});

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics | Grenze &copy; OpenStreetMap-Mitwirkende'
  }
).addTo(map);

// Alles, was zur aktuellen Stadt gehört (Maske, Umriss), liegt in dieser Gruppe
const stadtEbene = L.layerGroup().addTo(map);

function zeigeStadt(schluessel) {
  const stadt = STAEDTE[schluessel];
  stadtEbene.clearLayers();

  // Schwarze Maske: großes Rechteck mit der Stadt als "Loch"
  const aussenRechteck = [[30, -20], [30, 40], [70, 40], [70, -20]];
  L.polygon([aussenRechteck, ...stadt.ringe], {
    stroke: false,
    fillColor: '#000',
    fillOpacity: 1,
    interactive: false
  }).addTo(stadtEbene);

  // Dünner heller Stadtumriss
  stadt.ringe.forEach(ring => {
    L.polyline(ring, { color: '#fff', weight: 1.5, opacity: 0.8, interactive: false })
      .addTo(stadtEbene);
  });

  // Ansicht wechseln: erst Begrenzung lösen, dann hinfliegen, dann neu begrenzen
  map.setMaxBounds(null);
  map.fitBounds(stadt.grenzen);
  map.setMaxBounds(stadt.grenzen.pad(0.15));

  // Buttons markieren
  document.querySelectorAll('#stadtwahl button').forEach(b => {
    b.classList.toggle('aktiv', b.dataset.stadt === schluessel);
  });
}

// Klick auf die Buttons
document.querySelectorAll('#stadtwahl button').forEach(b => {
  b.addEventListener('click', () => zeigeStadt(b.dataset.stadt));
});

// Start mit Hamburg
zeigeStadt('hamburg');