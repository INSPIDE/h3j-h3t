/* jshint esversion: 9 */

const { exactEdgeLength } = require('h3-js');

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
        "coordinates": o.generate(j.h3_id)
      }
    };
    if (!!!o.promoteID) feature.id = parseInt(j.h3_id, 16);
    return feature;
  });
  return { "type": 'FeatureCollection', "features": fs };
};
const tileparser = (tile, options) => {
  return new Promise((resolve, reject) => {
    resolve(j2g(tile, options));
  });
};
const gjclean = gj => {
  // https://github.com/mapbox/mapbox-gl-js/blob/a8bfbfdb988831abe8ecb74bea19f5dc0086513a/src/style-spec/types.js#L135
  const valid = ['type', 'data', 'maxzoom', 'attribution', 'buffer', 'filter', 'tolerance', 'cluster', 'clusterRadius', 'clusterMaxZoom', 'clusterMinPoints', 'clusterProperties', 'lineMetrics', 'generateId', 'promoteId'];
  return filterObject(gj, (k, v) => valid.includes(k));
};
const vtclean = vt => {
  // https://github.com/mapbox/mapbox-gl-js/blob/a8bfbfdb988831abe8ecb74bea19f5dc0086513a/src/style-spec/types.js#L96
  const valid = ['type', 'url', 'tiles', 'bounds', 'scheme', 'minzoom', 'maxzoom', 'attribution', 'promoteId', 'volatile'];
  return filterObject(gj, (k, v) => valid.includes(k));
};
const filterObject = (obj, callback) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, val]) => callback(key, val))
  );
};

/*

  Custom vector tiles source

*/
const h3tsource = function(name, options) {
  const o = Object.assign({}, defaults, options, { "type": 'vector', "format": 'pbf' });
  o.generate = (o.geometry_type === 'Polygon') ? h3id => [utils.h3.h3ToGeoBoundary(h3id, true)] : h3id => utils.h3.h3ToGeo(h3id).reverse();
  if (!!o.promoteId) o.promoteId = o.h3field;
  lib.addProtocol('h3tiles', (params, callback) => {
    const u = `http${(o.https === false) ? '' : 's'}://${params.url.split('://')[1]}`;
    const s = params.url.split(/\/|\./i);
    const l = s.length;
    const zxy = s.slice(l - 4, l - 1).map((k) => k * 1);
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
      .then(js => tileparser(js, o))
      .then(g => {
        const f = utils.tovt(g).getTile(...zxy);
        const fo = {};
        fo[o.sourcelayer] = f;
        const
          p = utils.topbf.fromGeojsonVt(
            fo,
            { "version": 2 }
          );
        callback(null, p, null, null);
        if (!!o.debug) console.log(`${u}: ${js.features.length} features, ${(performance.now() - t).toFixed(0)} ms`);
      })
      .catch(e => {
        if (e.name === 'AbortError') e.message = `Timeout: Tile ${u} is taking too long to fetch`;
        callback(new Error(e));
        console.error(e.message);
      });
  });
  this.addSource(name, vtclean(o));
};
lib.Map.prototype.addH3TSource = h3tsource;


/*

  Custom geojson source

  https://github.com/mapbox/mapbox-gl-js/blob/c377a90e768c48b7a422596740e06cae2a55a055/src/source/geojson_source.js#L66-L346

*/
const h3jsource = function (name, options) {
  const controller = new AbortController();
  const signal = controller.signal;
  const o = Object.assign({}, defaults, options, { "type": 'geojson' });
  let t;
  o.generate = (o.geometry_type === 'Polygon') ? h3id => [utils.h3.h3ToGeoBoundary(h3id, true)] : h3id => utils.h3.h3ToGeo(h3id).reverse();
  if (!!o.promoteId) o.promoteId = o.h3field;
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
        .then(js => tileparser(js, o))
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
    tileparser(o.data, o)
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
  o.generate = (o.geometry_type === 'Polygon') ? h3id => [utils.h3.h3ToGeoBoundary(h3id, true)] : h3id => utils.h3.h3ToGeo(h3id).reverse();
  if (!!o.promoteId) o.promoteId = o.h3field;
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
      .then(js => tileparser(js, o))
      .then(g => {
        s.setData(g);
        if (!!o.debug) console.log(`${g.features.length} features, ${(performance.now() - t).toFixed(0)} ms`);
      })
      .catch(e => {
        if (e.name === 'AbortError') e.message = `Timeout: Data file ${data} is taking too long to fetch`;
        console.error(e.message);
      });
  } else {
    tileparser(data, o)
      .then(g => s.setData(g));
  }
};
lib.Map.prototype.setH3JData = h3jsetdata;