// MAP SETTINGS

// Retrieved from HOT TM - https://github.com/hotosm/tasking-manager/blob/develop/frontend/src/config/index.js
export const MAP_STYLE = {
    version: 8,
    // "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sources: {
        'raster-tiles': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
            tileSize: 128,
            attribution:
                '© <a href="https://www.openstreetmap.org/copyright/">OpenStreetMap</a> contributors',
        },
    },
    layers: [
        {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22,
        },
    ],
};