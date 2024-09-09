# Architecture Decision Record 1: Maplibre GL for Web Mapping Library

Date: 08/09/2024

# Context

We are building a web application that requires rendering medium to large sized polygons on a map interface. The solution must integrate well with React.js, be fast and performant, and should not significantly increase the bundle size. The development team is familiar with OpenLayers, Leaflet, MapLibre GL, and Deck.GL, making them all viable options. Given the nature of our use case, the focus is on performance, rendering capabilities, and overall size efficiency.

## Decision Drivers

- Ability to render medium to large polygons efficiently.
- Integration with React.js libraries.
- Performance, particularly in rendering and interaction with polygon geometries.
- Library size and impact on the overall application bundle.
- License

## Considered Options

- [OpenLayers](https://openlayers.org/): Powerful for handling complex geometries, good performance for rendering large datasets, robust features for mapping. However, it has a larger bundle size compared to others, and may require more customization to integrate smoothly with React.js.

- [Leaflet](https://leafletjs.com/): Lightweight, simple API, and easy integration with React.js (via react-leaflet). However, performance may degrade with large polygons, not as feature-rich for advanced rendering.

- [MapLibre GL](https://maplibre.org/maplibre-gl-js/docs/): Good performance, especially with vector tiles and polygons, integrates well with React.js, supports WebGL for high-performance rendering. However, it may be slightly larger than Leaflet but smaller than OpenLayers, and lacks some advanced 3D features compared to Deck.GL.

- [Deck.GL](https://deck.gl/): Excellent for rendering large-scale data visualizations, high-performance WebGL-based rendering, good React.js integration. However, it has the largest bundle size, may be overkill for simpler polygon rendering.

# Decision

We have decided to use MapLibre GL as the web mapping library for this project due to its balanced performance, polygon rendering capabilities, and seamless integration with React.js. MapLibre GL's WebGL-based performance makes it well-suited for rendering medium to large polygons, while its size is more moderate compared to alternatives like OpenLayers and Deck.GL. Additionally, since HOT plans to transition all their web mapping projects to MapLibre GL JS, this decision aligns with their future direction.


All four options (OpenLayers, Leaflet, MapLibre GL, and Deck.GL) are licensed under very permissive open-source licenses (BSD or MIT) meaning they align with HOT license requirements.

# Status

Approved.

# Consequences

Nil.
