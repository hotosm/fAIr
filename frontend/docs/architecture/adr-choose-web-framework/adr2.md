# Architecture Decision Record 2: Use React JS for Web Development Framework

Date: 09/09/2024

# Context

We are building the fAIr platform that requires high performance, fast development cycles, and scalability. The development team is proficient in React and Next.js, and HOT has a history of using React.js for most of its projects. To maintain consistency and leverage existing knowledge, we are considering web development frameworks that align with our team's skill set and project requirements.

## Decision Drivers

- Speed of development: minimizing the time required to build and deploy features.
- Performance: ensuring the web application is highly performant, especially in terms of loading times and SEO.
- Familiarity with the framework: developers are experienced with React and Next.js, reducing the need for additional training.
- Ease of deployment: Avoid vendor lock-in during deployment.

## Considered Options

- [React.js](https://react.dev/): Familiarity with the team, widely used in the company, rich ecosystem of libraries.

- [Next.js](https://nextjs.org/): Built on top of React, offers server-side rendering and static site generation out of the box, optimized for performance and SEO, familiar to the team.

- [Htmx](https://htmx.org/): Htmx gives you access to AJAX, CSS Transitions, WebSockets and Server Sent Events directly in HTML, using attributes, so you can build modern user interfaces with the simplicity and power of hypertext htmx is small, dependency-free, extendable & has reduced code base sizes by 67% when compared with react.


# Decision

The project will continue with React.js, given the team's expertise, rich ecosystem, strict project timeline, and its use within HOT. The choice of React.js also allows for separation of concern, without requiring changes to the backend, unlike htmx. Next JS was ruled out because the features it provides are not relavent to the project at this point.


React.js is licensed under very permissive open-source licenses (MIT) meaning it align with HOT license requirements.

# Status

Accepted.

# Consequences

New developers may need a brief period to adapt to React.js if they are only familiar with other frameworks.
