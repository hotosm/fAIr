
# Architecture Decision Record 1: Use Vite for Development Bundling and Build Tooling

Date: 10/10/2024

# Context

We need a fast and efficient bundler for our React app development. The chosen tool must support modern  TypeScript features while offering an optimal development experience.

## Decision Drivers

- Fast hot module replacement (HMR) for efficient development.
- Support for TypeScript and modern ES modules.
- Simple configuration.


## Considered Options

- Use [Webpack](https://webpack.js.org/) for bundling, which is highly configurable but can be slow.
- Use [Vite](https://vitejs.dev/), which offers faster builds and simpler configuration for modern projects.


# Decision

We will use Vite as our bundler and development server due to its superior performance during development and simple configuration.

# Status

Accepted.

# Consequences

There may be some minor limitations in terms of plugins compared to Webpack, but Vite’s ecosystem is growing rapidly, and we don't foresee any complex plugin requirements.


