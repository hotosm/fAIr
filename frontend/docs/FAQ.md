# Frequently Asked Questions (FAQ)

---

## For Users

**What is fAIr?**  
fAIr is an open-source toolkit by the Humanitarian OpenStreetMap Team (HOT) that brings artificial intelligence (AI) into humanitarian mapping. It provides AI models and tools to automate mapping tasks, making mapping faster and more accurate.

---

**How do I use fAIr in my mapping projects?**  
Follow the [installation guide](installation.md) to set up fAIr. Once running, you can use pre-trained AI models for tasks like road extraction, building detection, or land use classification. The documentation includes examples to help you get started.

---

**What data can I use with fAIr?**  
fAIr works with satellite and aerial imagery from open sources. Check the documentation for supported formats and recommended imagery providers.

---

**Can I customize the AI models?**  
Yes! You can train or fine-tune models with your own datasets to improve results for your region or mapping needs. See the [model customization guide](model-customization.md) for details.

---

**Are there any limitations?**  
AI accuracy depends on input imagery quality and task complexity. Some results may need manual review or editing. Always validate outputs before using them in production or uploading to OSM.

---

**How do I give feedback or report issues?**  
Open an issue or feature request on [GitHub](https://github.com/hotosm/fAIr/issues). Your feedback helps us improve!

---

**Can I integrate fAIr with other mapping tools?**  
Yes. fAIr is modular and exposes APIs and Python packages that can be used in other tools (e.g., QGIS, JOSM) or scripts. See the [integration guide](integration.md).

---

## For Developers

**How can I contribute?**  
Read the [contributing guide](contributing.md) for details on submitting code, reporting bugs, or improving documentation. Pull requests are welcome!

---

**What tech stack does fAIr use?**  
- **Frontend:** React (JavaScript/TypeScript)
- **Backend:** Django (Python)
- **AI/ML:** TensorFlow, PyTorch
- **Other:** Docker, PostgreSQL/PostGIS, Celery

---

**Are there coding standards?**  
Yes. Please follow our code style and contribution guidelines in the [contributing guide](contributing.md). We use tools like Black and pre-commit for formatting.

---

**Can I propose new AI models or improvements?**  
Absolutely! Propose new models or enhancements via pull requests or issues. For major changes, discuss with maintainers and the community first.

---

**What support is available for contributors?**  
Project maintainers and the HOT community are here to help. Join our [Slack](https://slack.hotosm.org) or open a GitHub discussion for questions.

---

If your question isn’t answered here, check the rest of the docs or [open an issue](https://github.com/hotosm/fAIr/issues).
