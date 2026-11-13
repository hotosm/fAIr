---
icon: lucide/git-pull-request
description: How to contribute to fAIr, from code and issues to new models.
---

# Contributing

Contributions of all skill levels are welcome, whether reporting a bug, testing functionality, improving the documentation, or adding a model. Please read the [Code of Conduct](code-of-conduct.md).

## Report bugs and suggest improvements

Use the [issue queue](https://github.com/hotosm/fAIr/issues) and the bug or feature templates. If you are new to contributing, look for issues labelled `good first issue`; these are reserved for human learning without AI tools.

## Code and documentation

1. Fork and clone the repository, then create a branch for your changes.
2. Follow [Developer setup](../guides/developer-setup.md) for tools and test commands, or [Run locally](../guides/run-locally.md) for the full stack.
3. Keep changes focused, add tests for new behaviour, and run the relevant tests and checks before opening a pull request.
4. Open a pull request explaining what changed and how you tested it. Declare your AI assistance level (0–5) in the PR template.

Documentation lives in `docs/`; improvements follow the same pull request process.
If you need help contributing, ask in HOT Slack's `#geospatial-tech-and-innovation` channel.

## AI tool usage

You may use AI tools to assist your contributions. You are fully responsible for everything you submit.

- **Understand it**: You must be able to explain every line of your code.
- **Test it**: AI-generated code must pass all tests and security checks.
- **Disclose it**: Pick an AI assistance level (0–5) in the PR template. If nobody has read the result, declare level 5 and open the PR as a draft.
- **Own it**: You are the author. If a reviewer asks why, you answer.

AI tools must not be used to fix issues labelled `good first issue`. These exist for human learning.

See the [AI-assisted coding guide](https://responsibleai.guide/ai-assisted-coding-guide/) for the full policy.

## Contributing a model

See [Contributing a model](../overview/models.md#contributing-a-model).

## Releases

1. Choose the next version with Commitizen (`cz bump`).
2. Merge develop → stage and open a PR from stage → main.
3. Run [Release QA](../architecture/release-qa.md) at <https://stage.ai.hotosm.org>.
4. Merge to main, publish the GitHub release (vX.Y.Z), and wait for the API and frontend images to publish.
5. Then update chart/Chart.yaml on develop with new version numbers.
6. When the push is made, a chart will be build and production deployment made automatically.
7. Run [Release QA](../architecture/release-qa.md) on production.

See [Infrastructure and deployment](../architecture/infrastructure.md) for details, [GitHub releases](https://github.com/hotosm/fAIr/releases) for release notes, and the [Roadmap](../roadmap/index.md) for shipped capabilities.
