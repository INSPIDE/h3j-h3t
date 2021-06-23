/* jshint esversion: 9 */

/*

  TODO:

  * ...

*/

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
  "newline": '\n', 
  "separator": ',',
  "promoteId": true,
  "type": 'vector',
  "format": 'pbf',
  "https": true
};
const csv2json = (csv, newline, separator, header) => {
  const lines = csv.split(newline);
  let h, ls, k;
  if (header == undefined) {
    [h, ...ls] = lines;
    k = h.split(separator);
  } else {
    k = header;
    ls = lines;
  }
  return (lines.length === 1 && lines[0] === '') ? new Array(0) : ls.map(l => (v =>
    k.reduce(
      (c, n, i) => ({
        ...c,
        [n]: v[i],
      }),
      {}
    )
  )(l.split(separator)));
};
const tileparser = (tile, options) => {
  return new Promise((resolve, reject) => {
    resolve(csv2json(tile, options.newline, options.separator, options.header));
  });
};
const h3tsource = (name, options) => {
  const o = Object.assign({}, defaults, options);
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
      .then(t => t.text())
      .then(t => tparser(t, o))
      .then(js => {
        const fs = js.map(j => {
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
        const g = { "type": "FeatureCollection", "features": fs };
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