# H3T

This module for [MapLibre GL](https://github.com/MapLibre/maplibre-gl-js) (or MapboxGL JS v1.x) allows to generate [H3](https://h3geo.org/) cells geometry clientside from tiled data and render and manage it later.

The H3 tiled data is served using `h3t://` protocol and it's designed for highest performance and lowest payload weight, while being as simplest as possible. Check [this document](SERVER.md) for more info on the tiles data format description and generation tutorial.

## Why?

Because we have a huge amount of stored data where the geometry is implicitly represented by its H3 index, and it makes no sense to waste time and resources generating and sending the geometries downstream to the client.

So, what about stripping the data to its bones and serving compact tuplas `h3index,  field1, ..., fieldN` and generate the vectortiles clientside?

**Note:** MVT doesn't support features without geometry, so this format is not an option

## Big Notice

This library relies on [this MapLibre GL PR](https://github.com/maplibre/maplibre-gl-js/pull/30), that's been discussed in [this issue](https://github.com/maplibre/maplibre-gl-js/issues/29). So it's not supported by the main branch yet.

This repo includes a bundled version of my fork for the 1.13-rc in the `maplibre` folder, where custom sources are available, so you can preview the feature that enables this module.

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

    map.addH3Source({
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
| map | object | `maplibre.Map` instance |  |
| h3field | string | Name of the property that contains the H3 index |  |
| https | booolean | Whether to request the tiles using SSL or not | true |
| sourcename | string | The id to be assigned to the source |  |
| sourcelayer | string | The name of the layer within the vector tile that will be renderized |  |
| sourceoptions | object | The same options that expects [Map.addSource](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addsource) for `vector` sources, while the `tiles` parameter should contain a `h3t://...` URL |  |
| debug | boolean | Whether to send to console some metrics per tile | false |

You can check a working example in the `examples` folder
