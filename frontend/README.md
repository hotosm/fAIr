# fAIr Frontend

This project is a frontend web application built using **React 18**, **TypeScript**, and **Vite**. The app leverages modern libraries such as **@hotosm/ui**, and **Shoelace** for UI components, and **React Router** for client-side routing.

## Table of Contents

- [Installation](#installation)
- [Build](#build)
- [Folder Structure](#folder-structure)
- [Codebase Standards](#codebase-standards)
- [Contributing](#contributing)
- [License](#license)

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

3. Create .env file inside root dir by following .env [sample](./.env.sample).

```bash
touch .env
```

4. Start the development server:

```bash
pnpm dev
```

The app will be available at **http://127.0.0.1:5173**. To change the default port, you can edit the [vite config](./vite.config.mts).

## Build

```bash
pnpm build
```

This will create an optimized build of your app in the dist/ folder, which can be deployed.

## Folder Structure

Here's an overview of the folder structure:

```markdown
├── public/ # Static assets like favicon, robots.txt and manifests.
├── src/ # main application codes are here.
│ ├── app/ # Contains the application routes and providers.
│ ├── assets/ # Static assets specific to the app (images, icons, etc.).
│ ├── components/ # Reusable components and layouts.
| |── features/ # Contains the main features of the application.
│ ├── hook/ # Reusable hooks.
│ ├── styles/ # Global styles.
│ ├── utils/ # Utility functions, application content and constants.
│ ├── config/ # Environment variable configuration object.
│ ├── services/ # Axios API clients and services.
│ ├── types/ # Reusable types.
│ └── main.tsx # Entry point of the React app.
├── docs/ # ARD documentation for some of the decisions made for the app.
└── vercel.json # To prevent the custom 404 page from Vercel when a route is visited. (This is just for the demo site deployed on Vercel.)
└── ... # Other configuration files like tsconfig.json, vite.config.mts etc.
```

## Codebase Standards

The project standards are crucial for maintaining code quality, consistency, and scalability in a React application. By establishing and adhering to a set of best practices, developers can ensure that the codebase remains clean, organized, and easy to maintain.

#### ESLint

ESLint is used to maintain code quality and adhering to coding standards.

#### Prettier

Prettier is a used to maintain consistent code formatting in the project.

#### TypeScript

This codebase is written in TypeScript.

#### Absolute imports

We use absolute imports (such as `@/components`, `@/hooks`, etc.), to make it easier to move files around and avoid messy import paths such as `../../../component`.

#### File naming conventions

We use the `kebab-case` to name all files. This helps to keep your codebase consistent and easier to navigate.

#### Architectural Decisions

See [the documentation](./docs/) for more information on the architectural decisions.

## Contributing

Please refer to the [CONTRIBUTING](../CONTRIBUTING.md) guide for more information.

## License

See [LICENSE](../LICENSE).

## Notes

The **@hotosm/ui** installation directory behavior is not consisitent and failed while deploying. However using the CDN and injecting it in the `index.html` works for now.
