# Contributing to fAIr

## :hugs: Welcome

:+1::tada: First off, I'm really glad you're reading this, because we need volunteer developers to help with the development of fAIr! :tada::+1:

We welcome and encourage contributors of all skill levels and we are committed to making sure your participation in our tech collective is inclusive, enjoyable and rewarding. If you have never contributed to an open-source project before, we are a good place to start and will make sure you are supported every step of the way. If you have **any** questions, please ask!

There are many ways to contribute to this repository:

## Testing

Adding test cases, or simply testing out existing functionality.

## Report bugs and suggest improvements

The [issue queue](https://github.com/hotosm/fAIr/issues) is the best way to get started. There are issue templates for BUGs and FEATURES that you can use, or you can create your own. Once you have submitted an issue, it will be assigned a label out of these [label categories](https://github.com/hotosm/fAIr/labels). If you are wondering where to start, you can filter by the GoodFirstIssue label.

## Code contributions

Fork this repository, Maintain your local changes on a separate branch and Create pull requests (PRs) for changes that you think are needed. We would really appreciate your help!

### Setting Up Your Development Environment

Before you start contributing code, set up your local development environment:

1. **Fork and clone** the repository:

   ```bash
   git clone https://github.com/hotosm/fAIr.git
   cd fAIr
   ```

2. **Set up Docker environment** (recommended):

   ```bash
   docker compose up
   cp backend/.env.example backend/.env
   docker compose up api worker
   ```

3. **Access the application**:
   - Frontend: <http://localhost:3500>
   - API root: <http://localhost:8000/api/>
   - Swagger UI: <http://localhost:8000/api/docs/>
   - ReDoc: <http://localhost:8000/api/redoc/>

4. **Make your changes** and see them live with hot reload!

For detailed setup instructions, see [Docker Installation Guide](./docs/Docker-installation.md) and [backend/README.md](./backend/README.md).

### Making Changes

## Documentation contributions

Create pull requests (PRs) for changes that you think are needed to the documentation of fAIr. As of now you can find the documentation work at the [docs](./docs) directory.

## :handshake: Thank you

Thank you very much in advance for your contributions!! Please ensure you refer to our [Code of Conduct](https://github.com/hotosm/fAIr/blob/main/docs/Code-of-Conduct.md).
If you've read the guidelines, but you are still not sure how to contribute on Github, please reach out to us via our Slack #geospatial-tech-and-innovation.
