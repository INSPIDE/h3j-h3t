/* jshint esversion: 6 */

import '../maplibre/maplibre-gl.js';
import '../dist/h3t.js';

const lib = globalThis.maplibregl;

const config = {
  // portall-api.inspide.com/v0/indicators/h3/{z}/{x}/{y}.mvt
  url: 'tiles3.mapillary.com/v0.1/{z}/{x}/{y}.mvt',
  sourcename: 'test-source',
  sourcelayer: 'mapillary-images',
  newline: '\r\n', 
  separator: '|', 
  header:'h3_id|stop',
  h3field: 'h3_id'
};

const map = new lib.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  center: [-3.703793, 40.416687],
  zoom: 16,
  minZoom: 14,
  maxZoom: 21,
});

map.on('load', () => {

  map.addH3TSource(
    config.sourcename, 
    {
      "h3field": config.h3field,
      "sourcelayer": config.sourcelayer,
      "tiles": [`h3t://${config.url}`],
      "minzoom": 14,
      "maxzoom": 14,
      "debug": true
    }
  );

  map.addLayer({
    "id": 'test-layer',
    "type": 'fill',
    "source": config.sourcename,
    "source-layer": config.sourcelayer,
    "paint": {
      "fill-color": '#f00',
      "fill-opacity": 0.25,
    },
  });

});