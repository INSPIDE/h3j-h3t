/*jshint esversion: 6 */

//#region custom source branch
import "../maplibre/mapbox-gl.js";
window.maplibre = mapboxgl;
import "../utils/dist/utils.js";
//#endregion

maplibre.addProtocol("h3t", (params, callback) => {
  /* console.log(`https://${params.url.split("://")[1]}`); */
  const 
    zxy = params.url.split('/'),
    l = zxy.length,
    z = zxy[l-3] * 1,
    x = zxy[l-2] * 1,
    y = zxy[l-1].split('.')[0] * 1;
  utils.togeojson({
      uri: `https://${params.url.split("://")[1]}`,
      layer: 'mapillary-images'
  }, function (e, gj) {
      if (e) throw e;
      if (gj.features.length === 0) {
        callback(null, null, null, null);
      }else{
        gj.features = gj.features.map(f=>{
          f.properties.touched = 1;
          return f;
        });
        const 
          vt = utils.tovt(gj),
          f = vt.getTile(z, x, y),
          p = utils.topbf.fromGeojsonVt({ 'mapillary-images': f });
          callback(null, p, null, null);
      }      
  });

/*   fetch(`https://${params.url.split("://")[1]}`)
    .then(t => {
      if (t.status == 200) {
        t.arrayBuffer().then(arr => {
          callback(null, arr, null, null);
        });
      } else {
        callback(new Error(`Tile fetch error: ${t.statusText}`));
      }
    })
    .catch(e => {
      callback(new Error(e));
    }); */
  return { cancel: () => {} };
});

const map = new maplibre.Map({
  container: "map",
  style: `https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`,
  center: [-3.703793, 40.416687],
  zoom: 14,
  minZoom: 14,
  maxZoom: 14
});

map.on("load", () => {
  map.addSource("test-source", {
    type: "vector",
    // https://www.mapillary.com/developer/tiles-documentation/#image-layer
    tiles: ["h3t://tiles3.mapillary.com/v0.1/{z}/{x}/{y}.mvt"],
    format: "pbf",
    minzoom: 14,
    maxzoom: 14
  });
  map.addLayer({
    id: "test-layer",
    type: "circle",
    source: "test-source",
    "source-layer": "mapillary-images",
    paint: {
      "circle-radius": 10,
      "circle-color":  [
        'match',
        ['get', 'touched'],        
        1,
        '#cf0',
        '#ff0000'
        ]
    }
  });
});


window.map= map;