---
icon: lucide/layout-dashboard
description: The React single-page app and its feature-sliced structure.
---

# Frontend

The frontend is a React 19 single-page app built with Vite and TypeScript, managed with pnpm. It renders maps with MapLibre GL and is styled with Tailwind CSS. Runtime configuration is read from `config.js`, so the same build runs against different environments. The full library choices, from data fetching to forms and authentication, are recorded in the [frontend decision records](decisions/frontend/README.md).

## Structure

The app is organized by feature, not by technical layer.

- `app/` holds `providers/` and `routes/`. Routes include the landing page, try-fair, start-mapping, ai-predictions, datasets, models, and profile.
- `features/` contains one self-contained slice per feature (for example `try-fair`, `model-creation`, `ai-predictions`, `datasets`, `mapswipe`, `user-profile`), each with its own `api/`, `components/`, and `hooks/`.
- `services/` holds the API client, routes, auth, and query configuration.
- `components/`, `config/`, `constants/`, `hooks/`, `store/`, `styles/`, `types/`, and `utils/` hold shared code.

## Feature to model mapping

The try-fair model picker builds its "feature to map" list from the backend `Category` table, then queries base and local models for each category slug. A feature that has no model under its slug is shown but disabled. A model's category is set at registration and stored in both the database row and the STAC item's `fair:category`.
