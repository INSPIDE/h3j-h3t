# H3T
### Tiled H3 data for clientside geometry generation

This module for [MapLibre GL](https://github.com/MapLibre/maplibre-gl-js) (starting with `v1.14.1-rc.2`) allows to generate [H3](https://h3geo.org/) cells geometry clientside from tiled compact data and render and manage them later.

The H3 tiled data is served using `h3t://` protocol and it's designed for highest performance and lowest payload weight, while being as simplest as possible. Check [this document](SERVER.md) for more info on the tiles data format description and generation tutorial.

## Why?

Because we have a huge amount of stored data where the geometry is implicitly represented by its H3 index, and it makes no sense to waste time and resources generating, storing and sending the geometries downstream to the client.

## H3T approach

So, what about stripping the data to its bones and serving compact tuplas `h3index,  field1, ..., fieldN` and generate the vectortiles clientside?

So, our ol'pal `CSV` comes to the rescue. And helped by `gzip` or, even better, `brotli`, the resulting tiles are the tiniest!



**Note:** MVT doesn't support features without geometry, so this format is not an option

## Install

First of all

`yarn install`

Then, just import it it as any other Node module out there.

`require('h3t')`

If you want an UMD bundle, you need to build it first

`yarn build`

Then you can just impor it in your JS code:

`import 'dist/h3t.js';`
## How to

Once imported, you will find a new method in your `maplibre.Map` object: `addH3Source` that you can use like:

```javascript
map.on('load', () => {

    map.addH3TSource({
        'map': map,
        'h3field': 'h3id',
        'sourcename': 'test-source',
        'sourcelayer': 'test-source-layer',
        'sourceoptions': {
            'type': 'vector',
            'tiles': ['h3t://server.test/{z}/{x}/{y}.h3t']
        }
    });

    map.addLayer({
        'id': 'test-layer',
        'type': 'fill',
        'source': 'test-source',
        'source-layer': 'test-source-layer',
        'paint':  {
        'fill-color': '#f00',
        'fill-opacity': 0.25
        }
    });

});
```

Parameters:
| Param | Datatype |  Description | Default |
|---|---|---|---|





| geometry_type | string | Geometry type at the output. Possible values are: `Polygon` (hex cells) and `Point` (cells centroids) | `Polygon` |
| h3field | string | Name of the property that contains the H3 index |  |
| promoteId | boolean | Whether to use the H3 index as unique feature ID (default) or generate a `bigint` one based on that index. Default is faster and OGC compliant, but taking into account [this issue](https://github.com/mapbox/mapbox-gl-js/issues/10257) you might want to set it to false depending on your use case| `true` |
| https | booolean | Whether to request the tiles using SSL or not | `true` |
| sourcename | string | The id to be assigned to the source |  |
| sourcelayer | string | The name of the layer within the vector tile that will be renderized |  |
| sourceoptions | object | The same options that expects [Map.addSource](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addsource) for `vector` sources, while the `tiles` parameter should contain a `h3t://...` URL |  |
| debug | boolean | Whether to send to console some metrics per tile | `false` |

You can check a working example in the `examples` folder

## benchmarks


|  | sample 1 | sample 2 |
|---|---|---|
|# features|4938| 2477|
|geojson (kb)|1800|884|
|h3j (kb)|252|127|
|geojson gzip (kb)|216|109|
|h3j gzip (kb)|23|12|
|overhead (ms)|68|37|