/*jshint esversion: 6 */
const
    utils = {
        'tovt': require('geojson-vt'),
        'togeojson': require('@mapbox/vt2geojson'),
        'topbf': require('vt-pbf'),
        'h3': require('h3-js')
    },
    h3tsource = o => {
        o.lib.addProtocol('h3t', (params, callback) => {
            console.time(params.url);
            const
                s = params.url.split(/\/|\./i),
                l = s.length,
                zxy = s.slice(l - 4, l - 1).map(s => s * 1);
            utils.togeojson({
                uri: `https://${params.url.split('://')[1]}`,
                layer: o.sourcelayer
            }, function (e, gj) {
                if (e) throw e;
                if (gj.features.length === 0) {
                    callback(null, null, null, null);
                } else {
                    gj.features = gj.features.map(f => {
                        f.properties.touched = 1;
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
                console.timeEnd(params.url);
            });
        });
        o.map.addSource(o.sourcename, o.sourceoptions);
    };

lib.Map.prototype.addH3Layer = h3tsource

module.exports = h3tsource; 