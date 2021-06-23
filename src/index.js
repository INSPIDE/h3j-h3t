/* jshint esversion: 9 */

const lib = globalThis.maplibregl;
const utils = {
  tovt: require('geojson-vt'),
  topbf: require('vt-pbf'),
  h3: require('h3-js'),
};
const defaults ={
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
    if(!!!o.promoteID) feature.id = parseInt(j.h3_id, 16);
    return feature;
  });
  return { "type": "FeatureCollection", "features": fs };
};
const tileparser = (tile, options) => {
  return new Promise((resolve, reject) => {
    resolve(j2g(tile, options));
  });
};

/*

  Custom vector tiles source

*/
const h3tsource = (name, options) => {
  const o = Object.assign({}, defaults, options, {"type": 'vector', "format": 'pbf'});
  o.generate = (o.geometry_type === 'Polygon') ? h3id => [utils.h3.h3ToGeoBoundary(h3id, true)] : h3id => utils.h3.h3ToGeo(h3id).reverse();
  if(!!o.promoteId) o.promoteId = o.h3field;
  
  lib.addProtocol('h3t', (params, callback) => {
    const t = performance.now();
    const u = `http${(o.https === false) ? '' : 's'}://${params.url.split('://')[1]}`;
    const s = params.url.split(/\/|\./i);
    const l = s.length;
    const zxy = s.slice(l - 4, l - 1).map((k) => k * 1);
    const controller = new AbortController();
    const signal = controller.signal;

    if (o.timeout > 0) setTimeout(() => controller.abort(), o.timeout);

    fetch(u, {signal})
      .then(r => {
        if (r.ok) {
          return r.text();
        } else {
          throw new Error(r.statusText);
        }
      })
      .then(t => t.json())
      .then(js => tileparser(js))
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
  //o.map.addSource(o.sourcename, o.sourceoptions);
  this.addSource(name, o);
};
lib.Map.prototype.addH3TSource = h3tsource;


/*

  Custom geojson source

*/
const h3jsource = (name, options) => {
  const t = performance.now();
  const controller = new AbortController();
  const signal = controller.signal;
  const o = Object.assign({}, defaults, options, {"type": 'geojson'});
  o.generate = (o.geometry_type === 'Polygon') ? h3id => [utils.h3.h3ToGeoBoundary(h3id, true)] : h3id => utils.h3.h3ToGeo(h3id).reverse();
  if(!!o.promoteId) o.promoteId = o.h3field;
  if (o.timeout > 0) setTimeout(() => controller.abort(), o.timeout);
  fetch(u, {signal})
      .then(r => {
        if (r.ok) {
          return r.text();
        } else {
          throw new Error(r.statusText);
        }
      })
      .then(t => t.json())
      .then(js => tileparser(js))
      .then(g => {
        o.data = g;
        this.addSource(name, o);
        if (!!o.debug) console.log(`${u}: ${g.features.length} features, ${(performance.now() - t).toFixed(0)} ms`);
      })
      .catch(e => {
        if (e.name === 'AbortError') e.message = `Timeout: Tile ${u} is taking too long to fetch`;
        console.error(e.message);
      });  
};
lib.Map.prototype.addH3JSource = h3jsource;


/*

  Update data in geojson/H3J layer

*/
const h3jsetdata = (name, data) => {
  const t = performance.now();
  const controller = new AbortController();
  const signal = controller.signal;
  const s = this.getSource(name);
  const o = s._options;
  //const o = Object.assign({}, defaults, options, {"type": 'geojson'});
  //o.generate = (o.geometry_type === 'Polygon') ? h3id => [utils.h3.h3ToGeoBoundary(h3id, true)] : h3id => utils.h3.h3ToGeo(h3id).reverse();
  //if(!!o.promoteId) o.promoteId = o.h3field;
  if(typeof data === 'string'){
    if (o.timeout > 0) setTimeout(() => controller.abort(), o.timeout);
    fetch(u, {signal})
      .then(r => {
        if (r.ok) {
          return r.text();
        } else {
          throw new Error(r.statusText);
        }
      })
      .then(t => t.json())
      .then(js => tileparser(js))
      .then(g => {
        this.getSource(name).setData(g);
        if (!!o.debug) console.log(`${u}: ${g.features.length} features, ${(performance.now() - t).toFixed(0)} ms`);
      })
      .catch(e => {
        if (e.name === 'AbortError') e.message = `Timeout: Tile ${u} is taking too long to fetch`;
        console.error(e.message);
      });
  }else{
    tileparser(data)
    .then(g => this.getSource(name).setData(g));
  }
};
lib.Map.prototype.setH3JData = h3jsetdata;