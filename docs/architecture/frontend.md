---
icon: lucide/layout-dashboard
description: The React single-page app, its stack, and its feature-sliced structure.
---

# Frontend

The frontend is a React single-page app built with Vite and managed with pnpm. Runtime configuration is read from `config.js`, so the same build runs against different environments.

## Stack

- **React 19** with **Vite** and **TypeScript**
- **MapLibre GL** for the map, **terra-draw** for drawing
- **TanStack Query** and **TanStack Table** for data fetching and tables
- **zustand** for local state
- **react-hook-form** with **zod** for forms and validation
- **Tailwind CSS** for styling
- **Hanko** for authentication

The reasoning behind these choices is recorded in the [frontend decision records](decisions/frontend/README.md).

## Structure

The app is organized by feature, not by technical layer.

- `app/` holds `providers/` and `routes/`. Routes include the landing page, try-fair, start-mapping, ai-predictions, datasets, models, and profile.
- `features/` contains one self-contained slice per feature (for example `try-fair`, `model-creation`, `ai-predictions`, `datasets`, `mapswipe`, `user-profile`), each with its own `api/`, `components/`, and `hooks/`.
- `services/` holds the API client, routes, auth, and query configuration.
- `components/`, `config/`, `constants/`, `hooks/`, `store/`, `styles/`, `types/`, and `utils/` hold shared code.

## Feature to model mapping

The try-fair model picker builds its "feature to map" list from the backend `Category` table, then queries base and local models for each category slug. A feature that has no model under its slug is shown but disabled. A model's category is set at registration and stored in both the database row and the STAC item's `fair:category`.
