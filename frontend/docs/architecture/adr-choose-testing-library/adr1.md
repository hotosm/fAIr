# Architecture Decision Record 1: Use Vitest as the Testing Library

Date: 31/12/2024

# Context

We are building a web application that requires a robust and maintainable testing strategy to ensure code quality, reliability, and confidence in our continuous integration pipeline. We want a solution that is easy to set up, widely supported in the JavaScript community, and provides both unit and integration testing capabilities.

## Decision Drivers

- Developer Experience: We want a testing framework with a fast feedback loop, minimal configuration, and good integration with Vite.

- Performance and Modern Features: We need a tool that executes tests quickly and supports cutting-edge features such as native ESM, TS integration, and fast in-memory testing.

## Considered Options

- Use Jest
    - Pros: Widely adopted, minimal configuration, built-in mocking and assertion, and good performance.
    - Cons: Primarily oriented around JavaScript/TypeScript; might not seamlessly integrate with other environments. Experimental support for ECMAScript modules. Does not integrate natively with Vite.

- Use Mocha + Chai
    - Pros: Highly customizable, flexible setup with well-known assertion library (Chai).
    - Cons: Requires additional libraries for mocking, slightly more complex configuration.

- Use Vitest
    - Pros: Built on top of Vite, offering lightning-fast test runs and modern ESM support; straightforward setup; good integration with React and TypeScript.
    - Cons: Newer project with a smaller community compared to Jest; may have more limited ecosystem for plugins.

# Decision

We will use Vitest as our testing tool. It integrates easily with modern front-end tooling, requires minimal configuration, has native ESM support and TypeScript integration making it suitable for our current and future needs.

# Status

Accepted.

# Consequences

By choosing Vitest, we gain a testing framework that is quick to run and easy to configure, encouraging a fast feedback loop during development. Vitest’s seamless integration with modern build tools and frameworks allows us to maintain a simpler development environment. However, because Vitest is newer and has a smaller ecosystem than Jest, we may need to be mindful of plugin availability and community support for very specialized testing needs.