# Architecture Decision Record 1: Use nuqs for URL-based UI State Management

Date: 02/03/2026

# Context

The frontend currently has multiple pages with search and filter controls that are reflected in URL query parameters. Historically, some pages managed this with ad-hoc utilities and manual synchronization between component state and `useSearchParams`, which increased complexity and inconsistency.

We have validated `nuqs` in the start mapping flow and found it to be a performant and ergonomic approach for query-string state handling. As more pages require URL-based state, we need a consistent, typed pattern across the frontend.

## Decision Drivers

- Consistent URL-state behavior across routes with search and filters.
- Better type safety and parsing for query params than manual string handling.
- Simpler implementation and maintenance compared to custom synchronization utilities.
- Good performance for frequent UI state updates tied to query parameters.
- Better developer experience and readability for future feature work.

## Considered Options

- Continue using `react-router-dom` `useSearchParams` with custom helper utilities.
- Use [`nuqs`](https://nuqs.dev/) as the standard query-state library.
- Keep filter/search state only in component/global state and avoid URL synchronization.

# Decision

We will standardize on `nuqs` for managing URL-based state in frontend routes that need query-parameter-backed UI state (for example: search text, filters, sorting, map/list toggles, pagination, and similar controls).

`react-router-dom` `useSearchParams` may still be used for simple one-off cases, but all new or refactored complex query-state flows should use `nuqs` as the default pattern.

# Status

Accepted.

# Consequences

- Query-state logic becomes more consistent and easier to reason about across pages.
- We reduce repeated boilerplate for parsing/serializing query parameters.
- Existing pages that use custom URL-state utilities may need incremental migration to align with this decision.
- Team members should follow the `nuqs` pattern used in the start mapping implementation as the reference approach.
