/*jshint esversion: 6 */

//#region custom source branch
import "../maplibre/mapbox-gl.js";
window.maplibre = mapboxgl;
import "../dist/h3t.js";
//#endregion

maplibre.addProtocol("h3t", (params, callback) => {
  const 
    s = params.url.split(/\/|\./i),
    l = s.length,
    zxy = s.slice(l-4, l-1).map(s => s * 1);
  h3t.togeojson({
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
          vt = h3t.tovt(gj),
          f = vt.getTile(...zxy),
          p = h3t.topbf.fromGeojsonVt({ 'mapillary-images': f }, { version: 2 });
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
      "circle-radius": 5,
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