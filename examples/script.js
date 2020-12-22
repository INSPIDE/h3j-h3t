/*jshint esversion: 6 */

import '../maplibre/mapbox-gl.js';
import '../dist/h3t.js';

const
  lib = globalThis.maplibre || globalThis.mapboxgl,
  map = new lib.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center: [-3.703793, 40.416687],
    zoom: 16,
    minZoom: 14,
    maxZoom: 21
  });

map.on('load', () => {

  map.addH3Source({
    'map': map,
    'h3field': 'h3_id',
    'sourcename': 'test-source',
    'sourcelayer': 'mapillary-images',
    'sourceoptions': {
      'type': 'vector',
      // 'tiles': ['h3t://portall-api.inspide.com/v0/indicators/h3/{z}/{x}/{y}.mvt'],
      'tiles': ['h3t://tiles3.mapillary.com/v0.1/{z}/{x}/{y}.mvt'],
      'format': 'pbf',
      'minzoom': 14,
      'maxzoom': 14
    },
    'debug': true
  });

  map.addLayer({
    'id': 'test-layer',
    'type': 'circle',
    'source': 'test-source',
    'source-layer': 'mapillary-images',
    'paint': {
      'circle-radius': 3,
      'circle-color': [
        'match',
        ['get', 'touched'],
        1,
        '#f00',
        '#000'
      ]
    }
  });
});

window.map = map;