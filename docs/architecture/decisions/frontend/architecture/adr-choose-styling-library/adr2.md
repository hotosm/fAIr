# Architecture Decision Record 2: Use Shoelace for Styling Library

Date: 10/09/2024

# Context

We are building the fAIr website that requires a responsive and customizable user interface. The stying must be consistent and modern, ensuring a great user experience. The development team has experience using custom CSS but wants to explore CSS frameworks that can save time and effort. We are looking for a framework that is easy to use, customizable, has a large community for support and has a compatible license with HOT.

## Decision Drivers

- Easy to use: We want a framework that is simple to learn and can be integrated into our development workflow.

- Customizable: We want a framework that can be customized to match the HOT brand guidelines and theme.

- Large community support: We want a framework that has an active community of developers, libraries, and designers that can provide help and resources when needed.

- Time-saving: We want a framework that can save time and effort in styling the UI.

- License: We want a framework that is open source and compatible with HOT licensing requirement.

- Size & Performance: We want a framework that ships small CSS to the client, and would not bloat the website.

- Future proof: Aligns with the future requirements of HOT tools in the long run.

## Considered Options

- [Bootstrap](https://getbootstrap.com/): A popular CSS framework with a lot of pre-built components and a large community of developers.

- [Material UI](https://mui.com/material-ui/): A CSS framework based on Google's Material Design language with pre-built components for UI development.

- [Chakra UI](https://v2.chakra-ui.com/): Create accessible React apps with speed.

- [SCSS](https://sass-lang.com/): CSS with superpowers.

- [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework with a focus on customization and efficiency.

- [Shoelace](https://shoelace.style/): A forward-thinking library of web components.

# Decision

We've chosen to use Shoelace because it meets all our key decision criteria and aligns with the future requirements of [HOT UI](https://github.com/hotosm/ui). This alignment ensures long-term compatibility and simplifies any potential migration to a different framework in the future, if needed.

# Status

Accepted.

# Consequences

Nil.
