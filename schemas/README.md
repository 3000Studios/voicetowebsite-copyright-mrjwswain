# VoiceToWebsite JSON Schemas

Canonical JSON Schema Draft 2020-12 definitions for repo-backed data.

## Registry

See [`index.json`](./index.json). Each entry declares a schema `$id`, the relative `path`, and the repo globs it covers.

## Runtime validation

The runtime uses [`ajv`](https://ajv.js.org/) (with `ajv-formats`). Import the shared validator from
[`server/services/schemaValidator.js`](../server/services/schemaValidator.js):

```js
import { validate } from '../server/services/schemaValidator.js'

validate('blog-post', payload) // throws on failure, returns the value on success
```

Validators load lazily and are cached. Add new schemas by dropping a `*.schema.json` file in this folder
and registering it in `index.json`.

## Editor IntelliSense

`.vscode/settings.json` binds these schemas to the matching repo globs via `json.schemas`. Any IDE that
honors that setting (VS Code, Cursor, WebStorm, Zed, Neovim with `coc-json`) will provide completion and
diagnostics inline.

External tool references use the canonical `$id` URLs so downstream consumers (SchemaStore mirrors,
documentation sites, external services) can resolve them without depending on this repo's file layout.

## Validating the whole content tree

```bash
npm run validate:schemas
```

That script is also executed as part of `npm test` so CI catches drift.
