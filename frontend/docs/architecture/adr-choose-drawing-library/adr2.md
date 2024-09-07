# Architecture Decision Record 2: TerraDraw for Drawing Library

Date: 08/09/2024

# Context

We are developing a web application that requires a drawing library for creating, editing, and managing spatial geometries (mainly polygons). The selected library must integrate well with our existing React.js framework and web mapping library, support key drawing features, offer an easy to use API, and be fast and efficient.

## Decision Drivers

- Compatible with Maplibre GL JS.
- Performant.
- Flexible API.

## Considered Options

- [Terra Draw](https://github.com/JamesLMilner/terra-draw): Terra Draw centralizes map drawing logic and provides a host of out-of-the-box drawing modes that work across different JavaScript mapping libraries. It also allows you to bring your own modes!
- [Mapbox GL Draw](https://github.com/mapbox/mapbox-gl-draw): Strong performance with WebGL rendering, excellent support for vector data, works well with Mapbox and Maplibre GL.

# Decision

We’ve chosen TerraDraw as the drawing library for this project. After developing a [demo](https://github.com/jeafreezy/webmap-compare) app to test its functionality, we found that it meets the project's requirements effectively.

# Status

Approved.

# Consequences

Nil.
