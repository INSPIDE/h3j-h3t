/* jshint esversion: 9 */

import '../../maplibre/maplibre-gl.js';
import '../../dist/h3j_h3t.js';

const lib = globalThis.maplibregl;

const map = new lib.Map({
  "container": 'map',
  "style": 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  "center": [-3.703793, 40.416687],
  "zoom": 16,
  "minZoom": 14,
  "maxZoom": 21,
  "antialias": true
});


map.on('load', e => {
  map.addH3JSource(
    'h3j_testsource',
    {
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

    // map.setH3JData('h3j_testsource','data/sample_2.h3j', {"debug": true });


});

window.map = map;