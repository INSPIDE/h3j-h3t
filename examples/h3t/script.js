/* jshint esversion: 9 */

import '../../maplibre/maplibre-gl.js';
import '../../dist/h3t.js';

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

map.on('load', () => {

  map.addH3TSource(
    'test-source', 
    {
      "sourcelayer": 'test-layer',
      "tiles": ['h3tiles://portall-api.inspide.com/v0/indicators/pop/{z}/{x}/{y}.h3t?apikey=qb8UE3HrKzU8h78IpYeLKTOVJsdnt15u'],
      "minzoom": 14,
      "maxzoom": 14,
      "debug": true
    }
  );

  map.addLayer({
    "id": 'test-layer',
    "type": 'fill',
    "source": 'test-source',
    "source-layer": 'test-layer',
    "paint": {
      "fill-color": {
        "property": 'value',
        "stops": [
          [1,"#fdc7b7"],
          [2,"#fe9699"],
          [3,"#f16580"],
          [4,"#d9316c"],
          [5,"#a71f65"],
          [6,"#760e5d"],
          [7,"#430254"]
        ]
        },
      "fill-opacity": 0.25,
    }
  });
  
});