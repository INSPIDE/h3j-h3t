/* jshint esversion: 6 */

import '../../maplibre/maplibre-gl.js';
import '../../dist/h3t.js';

const lib = globalThis.maplibregl;

const map = new lib.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  center: [-3.703793, 40.416687],
  zoom: 14,
  minZoom: 12,
  maxZoom: 21,
});

map.on('load', e => {
  map.addH3JSource(
    'h3j_testsource',
    {
      "h3field": 'h3_id',
      "data": 'data/sample_1.h3j',
      "debug": true
    }
  ).then(m => m.addLayer({
      "id": 'h3j_testlayer',
      "type": 'fill',
      "source": 'h3j_testsource',
      "paint": {
        "fill-color": '#f00',
        "fill-opacity": 0.25,
      }
    })
  );

    // map.setH3JData('h3j_testsource','data/sample_2.h3j')


});

window.map = map;