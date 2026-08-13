# Contributing to BreadFile

Thanks for helping improve BreadFile.

## Before opening an issue

- Check whether the issue already exists.
- Confirm the problem on the current production site: [bread.beno.app](https://bread.beno.app).
- Remember that document processing happens locally in the browser; never attach confidential PDFs to a public issue.

A useful bug report includes:

- What you expected
- What happened instead
- Steps to reproduce it
- Browser and operating system
- A non-sensitive sample file, if needed

## Development

```bash
git clone https://github.com/rohman13/breadfile.git
cd breadfile
npm install
npm run dev
```

Before submitting a pull request:

```bash
npm run test:run
npm run build
```

## Pull requests

- Keep each pull request focused on one change.
- Explain the user-facing effect and how you tested it.
- Add or update tests for behavior changes.
- Preserve BreadFile's browser-only privacy model. Do not add file uploads or server-side document processing without prior discussion.
- Do not commit credentials, private documents, `node_modules`, or generated `dist` files.

Pull requests run tests and a production build. Merges to `main` deploy automatically to Cloudflare after verification passes.

## Security reports

Do not disclose security vulnerabilities in a public issue. Use GitHub's private vulnerability reporting feature on the repository's **Security** tab.

## Conduct

Participation in this project is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
