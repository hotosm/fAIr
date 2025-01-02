# Getting Started

## Installation

Note: This project is tested with Node v20.13.1.

1. Clone the repository:

```bash
git https://github.com/hotosm/fAIr.git
cd fAIr/frontend
```

2. Install dependencies using [pnpm](https://pnpm.io/), [npm](https://www.npmjs.com/), or [yarn](https://yarnpkg.com/). This project uses pnpm:

```bash
pnpm install
```

3. Create .env file inside root dir by following .env [sample](../.env.sample).

```bash
touch .env
```

4. Start the development server:

```bash
pnpm dev
```

The app will be available at **http://127.0.0.1:5173**. To change the default port, you can edit the [vite config](../vite.config.mts).

## Build

```bash
pnpm build
```

This will create an optimized build of your app in the dist/ folder, which can be deployed.

## Folder Structure

Here's an overview of the folder structure:

```markdown
├── public/ - Static assets like favicon, robots.txt and manifests.
├── src/ - Main application codes are here.
│ ├── app/ - Contains the application routes and providers.
│ ├── assets/ - Static assets specific to the app (images, icons, etc.).
│ ├── components/ - Reusable components and layouts.
│ ├── config/ - Environment variables configuration.
│ ├── constants/ - App UI contents and constants.
│ ├── enums/ - Reusable enums.
| |── features/ - Contains the main features of the application.
│ ├── hook/ - Reusable hooks.
│ ├── services/ - Axios API clients and services.
│ ├── styles/ - Global styles.
│ ├── types/ - Reusable types.
│ ├── utils/ - Utility functions, application content and constants.
│ └── main.tsx - Entry point of the React app.
├── docs/ - ARD documentation for some of the decisions made for the app.
└── vercel.json  - To prevent the custom 404 page from Vercel when a route is visited. (This is just for the demo site deployed on Vercel.)
└── ... Other configuration files like tsconfig.json, vite.config.mts etc.
```

## Codebase Standards

The project utilized the following codebase standards:

#### ESLint

ESLint is used to maintain code quality and adhering to coding standards.

#### Prettier

Prettier is a used to maintain consistent code formatting in the project. To format run the code below in the terminal.

```bash
1. pnpm/npm/yarn format

2. pnpm/npm/yarn format:check
```
#### Tests

Vitest is a used to write the tests in the codebase. To run the tests, run the command below:

```bash
pnpm/npm/yarn test
```

#### Documentation

Vitepress is a used to power this documentation site. To update the docs check the `docs` folder and run the command below to preview your changes:

```bash
pnpm/npm/yarn docs:dev
```

#### TypeScript

This codebase is written in TypeScript.

#### Absolute imports

We use absolute imports (such as `@/components`, `@/hooks`, etc.), to make it easier to move files around and avoid messy import paths such as `../../../component`.

#### File naming conventions

We use the `kebab-case` to name all files. This helps to keep your codebase consistent and easier to navigate.

#### Architectural Decisions

See [the documentation](./architecture/README.md) for more information on the architectural decisions.

#### File Organization

The file organization is inspired by [Bulletproof React](https://github.com/alan2207/bulletproof-react) with a few modifications.
