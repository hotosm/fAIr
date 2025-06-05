# Release Process

We use [Commitizen](https://pypi.org/project/commitizen/) to manage versioning and releases.

---

## Steps to Create a Release

1. **Install Commitizen**

    ```bash
    pip install commitizen
    ```

2. **Make Commits Using Commitizen**

    Use Commitizen to create conventional commits:

    ```bash
    cz commit
    ```

    This helps automate changelogs and version bumps.

3. **Bump the Version**

    After your changes are committed, bump the project version and generate the changelog:

    ```bash
    cz bump
    ```

4. **Push Changes and Tags**

    ```bash
    git push
    git push --tags
    ```

---

## Tips

- Always use `cz commit` for new features, fixes, or breaking changes.
- Review the generated changelog before pushing.
- For more info, see the [Commitizen documentation](https://commitizen-tools.github.io/commitizen/).

---

Happy releasing!
