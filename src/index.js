/* jshint esversion: 9 */

const lib = globalThis.maplibregl;
const utils = {
  tovt: require('geojson-vt'),
  topbf: require('vt-pbf'),
  h3: require('h3-js'),
};
const defaults = {
  "geometry_type": 'Polygon',
  "timeout": 0,
  "debug": false,
  "promoteId": true,
  "https": true
};
// json to geojson
const j2g = (js, o) => {
  const fs = js.cells.map(j => {
    const feature = {
      "properties": j,
      "geometry": {
        "type": o.geometry_type,
        "coordinates": o.generate(j.h3id)
      }
    };
    if (!!!o.promoteID) feature.id = parseInt(j.h3id, 16);
    return feature;
  });
  return { "type": 'FeatureCollection', "features": fs };
};
const h3jparser = (tile, options) => {
  return new Promise((resolve, reject) => {
    resolve(j2g(tile, options));
  });
};
const gjclean = gj => {
  // https://github.com/maplibre/maplibre-gl-js/blob/4b753d23dde82af45c61cd76c0530face1346721/src/style-spec/types.js#L122
  const valid = ['type', 'data', 'maxzoom', 'attribution', 'buffer', 'filter', 'tolerance', 'cluster', 'clusterRadius', 'clusterMaxZoom', 'clusterMinPoints', 'clusterProperties', 'lineMetrics', 'generateId', 'promoteId'];
  return filterObject(gj, (k, v) => valid.includes(k));
};
const vtclean = vt => {
  // https://github.com/maplibre/maplibre-gl-js/blob/4b753d23dde82af45c61cd76c0530face1346721/src/style-spec/types.js#L83
  const valid = ['type', 'url', 'tiles', 'bounds', 'scheme', 'minzoom', 'maxzoom', 'attribution', 'promoteId', 'volatile'];
  return filterObject(vt, (k, v) => valid.includes(k));
};
const filterObject = (obj, callback) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, val]) => callback(key, val))
  );
};

/*

  Custom vector tiles source

*/
const h3tsource = function (name, options) {
  const o = Object.assign({}, defaults, options, { "type": 'vector', "format": 'pbf' });
  o.generate = h3id => (o.geometry_type === 'Polygon') ? [utils.h3.h3ToGeoBoundary(h3id, true)] : utils.h3.h3ToGeo(h3id).reverse();
  if (!!o.promoteId) o.promoteId = 'h3id';
  lib.addProtocol('h3tiles', (params, callback) => {
    const u = `http${(o.https === false) ? '' : 's'}://${params.url.split('://')[1]}`;
    const s = params.url.split(/\/|\./i);
    const l = s.length;
    const zxy = s.slice(l - 4, l - 1).map(k => k * 1);
    const controller = new AbortController();
    const signal = controller.signal;
    let t;
    if (o.timeout > 0) setTimeout(() => controller.abort(), o.timeout);
    fetch(u, { signal })
      .then(r => {
        if (r.ok) {
          t = performance.now();
          return r.json();
        } else {
          throw new Error(r.statusText);
        }
      })
      .then(js => h3jparser(js, o))
      .then(g => {
        const f = utils.tovt(g).getTile(...zxy);
        const fo = {};
        fo[o.sourcelayer] = f;
        const
          p = utils.topbf.fromGeojsonVt(
            fo,
            { "version": 2 }
          );
        if (!!o.debug) console.log(`${zxy}: ${g.features.length} features, ${(performance.now() - t).toFixed(0)} ms`);
        callback(null, p, null, null);
      })
      .catch(e => {
        if (e.name === 'AbortError') e.message = `Timeout: Tile .../${zxy.join('/')}.h3t is taking too long to fetch`;
        callback(new Error(e));
      });
  });
  this.addSource(name, vtclean(o));
};
lib.Map.prototype.addH3TSource = h3tsource;


/*

  Custom geojson source

  https://github.com/maplibre/maplibre-gl-js/blob/main/src/source/geojson_source.js

*/
const h3jsource = function (name, options) {
  const controller = new AbortController();
  const signal = controller.signal;
  const o = Object.assign({}, defaults, options, { "type": 'geojson' });
  let t;
  o.generate = h3id => (o.geometry_type === 'Polygon') ? [utils.h3.h3ToGeoBoundary(h3id, true)] : utils.h3.h3ToGeo(h3id).reverse();
  if (!!o.promoteId) o.promoteId = 'h3id';
  if (o.timeout > 0) setTimeout(() => controller.abort(), o.timeout);
  if (typeof o.data === 'string') {
    if (o.timeout > 0) setTimeout(() => controller.abort(), o.timeout);
    return new Promise((resolve, reject) => {
      fetch(o.data, { signal })
        .then(r => {
          if (r.ok) {
            t = performance.now();
            return r.json();
          } else {
            throw new Error(r.statusText);
          }
        })
        .then(js => h3jparser(js, o))
        .then(g => {
          o.data = g;
          this.addSource(name, gjclean(o));
          if (!!o.debug) console.log(`${g.features.length} features, ${(performance.now() - t).toFixed(0)} ms`);
          resolve(this);
        })
        .catch(e => {
          if (e.name === 'AbortError') e.message = `Timeout: Source file ${o.data} is taking too long to fetch`;
          console.error(e.message);
        });
    });
  } else {
    h3jparser(o.data, o)
      .then(g => {
        o.data = g;
        this.addSource(name, gjclean(o));
        return new Promise((resolve, reject) => resolve(this));
      });
  }
};
lib.Map.prototype.addH3JSource = h3jsource;


/*

  Update data in geojson/H3J layer

*/
const h3jsetdata = function (name, data, options) {
  const o = Object.assign({}, defaults, options);
  o.generate = h3id => (o.geometry_type === 'Polygon') ? [utils.h3.h3ToGeoBoundary(h3id, true)] : utils.h3.h3ToGeo(h3id).reverse();
  if (!!o.promoteId) o.promoteId = 'h3id';
  const controller = new AbortController();
  const signal = controller.signal;
  const s = this.getSource(name);
  let t;
  if (typeof data === 'string') {
    if (o.timeout > 0) setTimeout(() => controller.abort(), o.timeout);
    fetch(data, { signal })
      .then(r => {
        if (r.ok) {
          t = performance.now();
          return r.json();
        } else {
          throw new Error(r.statusText);
        }
      })
      .then(js => h3jparser(js, o))
      .then(g => {
        s.setData(g);
        if (!!o.debug) console.log(`${g.features.length} features, ${(performance.now() - t).toFixed(0)} ms`);
      })
      .catch(e => {
        if (e.name === 'AbortError') e.message = `Timeout: Data file ${data} is taking too long to fetch`;
        console.error(e.message);
      });
  } else {
    h3jparser(data, o)
      .then(g => s.setData(g));
  }
};
lib.Map.prototype.setH3JData = h3jsetdata;