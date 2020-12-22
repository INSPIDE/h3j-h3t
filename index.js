/*jshint esversion: 6 */
const
    lib = globalThis.maplibre || globalThis.mapboxgl,
    utils = {
        'tovt': require('geojson-vt'),
        'togeojson': require('@mapbox/vt2geojson'),
        'topbf': require('vt-pbf'),
        'h3': require('h3-js')
    },
    h3tsource = o => {
        lib.addProtocol('h3t', (params, callback) => {
            !!o.debug && console.time(params.url);
            const
                u = `https://${params.url.split('://')[1]}`,
                h = o.h3field || 'h3_id',
                s = params.url.split(/\/|\./i),
                l = s.length,
                zxy = s.slice(l - 4, l - 1).map(s => s * 1);
            utils.togeojson({
                uri: u,
                layer: o.sourcelayer
            }, function (e, gj) {
                if (e) throw e;
                if (gj.features.length === 0) {
                    callback(null, null, null, null);
                    !!o.debug && console.warn(`Tile empty (${u})`);
                } else {
                    gj.features = gj.features.map(f => {
                        //TODO: todo lo de h3
                        /* const
                            c = f.geometry.coordinates, 
                            h = utils.h3.geoToH3(c[1], c[0], 11);  */
                        f.properties.touched = 1;
                        //f.geometry.type = 'Polygon';
                        //f.geometry.coordinates = utils.h3.h3ToGeoBoundary(h);
                        return f;
                    });
                    const
                        f = utils.tovt(gj).getTile(...zxy),
                        fo = {};
                    fo[o['sourcelayer']] = f;
                    const
                        p = utils.topbf.fromGeojsonVt(
                            fo,
                            { 'version': 2 }
                        );
                    callback(null, p, null, null);
                }
                !!o.debug && console.timeEnd(params.url);
            });
        });
        o.map.addSource(o.sourcename, o.sourceoptions);
    };

lib.Map.prototype.addH3Source = h3tsource;