
# Architecture Decision Record 1: Use pnpm as the Package Manager

Date: 10/10/2024

# Context

We need a package manager to efficiently manage dependencies for our React application. The solution should support fast installs, and efficient disk space usage.

## Decision Drivers

- Faster and more efficient dependency management.
- Support for monorepo structure if needed in the future.
- Reduced disk space usage by avoiding duplicate packages.


## Considered Options

- Use [npm](https://www.npmjs.com/) as the default package manager.
- Use [Yarn](https://yarnpkg.com/) for faster installs and better cache management.
- Use [pnpm](https://pnpm.io/), which offers fast installs and reduced disk space usage.


# Decision

We will use pnpm for managing dependencies due to its speed, efficiency, and ability to save disk space by avoiding redundant packages.

# Status

Accepted.

# Consequences

May require some developers to adapt to a different package management workflow if they are unfamiliar with pnpm.


