/* jshint esversion: 6 */
const lib = globalThis.maplibre || globalThis.mapboxgl;
const utils = {
  tovt: require('geojson-vt'),
  togeojson: require('@mapbox/vt2geojson'),
  topbf: require('vt-pbf'),
  h3: require('h3-js'),
};
const h3tsource = (o) => {
  lib.addProtocol('h3t', (params, callback) => {
    const t = performance.now();
    const u = `http${(o.https === false) ? '' : 's'}://${params.url.split('://')[1]}`;
    // const h3id = o.h3field || 'h3_id';
    const s = params.url.split(/\/|\./i);
    const l = s.length;
    const zxy = s.slice(l - 4, l - 1).map((k) => k * 1);
    utils.togeojson({
      uri: u,
      layer: o.sourcelayer,
    }, (e, gj) => {
      if (e) throw e;
      if (gj.features.length === 0) {
        callback(null, null, null, null);
        !!o.debug && console.warn(`${u}: Empty`);
      } else {
        const g = Object.assign({}, gj);
        g.features = gj.features.map((f) => {
          const c = f.geometry.coordinates;
          const h = utils.h3.geoToH3(c[1], c[0], 12);
          f.id = parseInt(h, 16);
          f.properties ={
              h3: h
          };
          f.geometry = {
            type: 'Polygon',
            coordinates: [utils.h3.h3ToGeoBoundary(h, true)]
          };
          return f;
        });
        const f = utils.tovt(g).getTile(...zxy);
        const fo = {};
        fo[o.sourcelayer] = f;
        const
          p = utils.topbf.fromGeojsonVt(
            fo,
            { version: 2 }
          );
        callback(null, p, null, null);
        !!o.debug && console.log(`${u}: ${gj.features.length} features, ${(performance.now() - t).toFixed(0)} ms`);
      }
    });
  });
  o.map.addSource(o.sourcename, o.sourceoptions);
};

lib.Map.prototype.addH3Source = h3tsource;
