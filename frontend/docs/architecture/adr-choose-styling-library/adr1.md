# Architecture Decision Record 1: Tailwind CSS for Styling Library

Date: 01/09/2024

# Context

We are building the fAIr website that requires a responsive and customizable user interface. The stying must be consistent and modern, ensuring a great user experience. The development team has experience using custom CSS but wants to explore CSS frameworks that can save time and effort. We are looking for a framework that is easy to use, customizable, has a large community for support and has a compatible license with HOT.

## Decision Drivers

- Easy to use: We want a framework that is simple to learn and can be integrated into our development workflow.

- Customizable: We want a framework that can be customized to match the HOT brand guidelines and theme.

- Large community support: We want a framework that has an active community of developers, libraries, and designers that can provide help and resources when needed.

- Time-saving: We want a framework that can save time and effort in styling the UI.

- License: We want a framework that is open source and compatible with HOT licensing requirement.

- Size & Performance: We want a framework that ships small CSS to the client, and would not bloat the website.

## Considered Options

- [Bootstrap](https://getbootstrap.com/): A popular CSS framework with a lot of pre-built components and a large community of developers.

- [Material UI](https://mui.com/material-ui/): A CSS framework based on Google's Material Design language with pre-built components for UI development.

- [Chakra UI](https://v2.chakra-ui.com/): Create accessible React apps with speed.

- SCSS: CSS with superpowers.

- [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework with a focus on customization and efficiency.

# Decision

After considering the options, we will use Tailwind CSS for the following reasons:

- Easy to use: Tailwind's approach is simple and easy to understand. Its utility classes make building a UI faster.

- Customizable: Tailwind allows for customization by providing a set of configuration files that allow developers to modify the framework's default styles with ease.

- Large community support: Tailwind has a very active community of developers, open source libraries, and designers that are consistently creating new resources, plugins, and tools.

- Time-saving: Tailwind can save time, enabling the team to focus on other areas of the project.

- License: Tailwing's license is MIT, which complies with HOT licensing requirement.

- Size & Performance: Unlike other considered options, Tailwing is smaller and ships less than 10KB to the client.


We will use Tailwind CSS's utility classes to build the UI for our project. The development team will use its atomic and modular design system to write efficient and scalable CSS code. We will leverage Tailwind's pre-built templates and visual components to speed up the development process while utilizing custom styles to match the branding and theme of HOT.

# Status

Proposed.

# Consequences

- New developers onboarding this project may face a slight learning curve.
- Since most UI elements will be built from scratch, there could be minor development slowdown compared to using component-based frameworks like Material UI or Chakra UI. Although component-based frameworks may also introduce some learning curve and inflexibility.

