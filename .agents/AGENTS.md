# Project Rules for PokeValue Web

- **Control de Versiones y Semantic Versioning**:
  Siempre que se realicen cambios que se vayan a subir o subir al repositorio, se debe incrementar el campo `APP_VERSION` en `src/config/config.js`, el campo `"version"` en `package.json` y el `CACHE_NAME` en `sw.js` siguiendo versionado semántico:
  - **Patch (`x.x.+1`)**: Para correcciones de errores (bug fixes) o pequeños ajustes.
  - **Minor (`x.+1.0`)**: Para refactorizaciones de arquitectura, nuevas funcionalidades o cambios estructurales.
