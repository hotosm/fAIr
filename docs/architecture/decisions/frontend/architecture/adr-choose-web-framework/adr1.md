# Architecture Decision Record 1: React JS for Web Development Framework

Date: 01/09/2024

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

# Decision

We will use React.js as the framework for this project. This decision leverages the team's extensive knowledge of React.js and its established use within HOT. Additionally, React.js offers straightforward deployment options, which potentially aligns well with HOT's current DevOps processes. In contrast, while Next.js provides some advanced features, concerns over potential vendor lock-in with Vercel and the complexity of alternative deployment methods make it less suitable for our needs at this time. React.js ensures a smoother and more efficient deployment process without compromising our flexibility.

The two options (React.js and Next.js) are licensed under very permissive open-source licenses (MIT) meaning they align with HOT license requirements.

# Status

Proposed.

# Consequences

New developers may need a brief period to adapt to React.js if they are only familiar with other frameworks.
