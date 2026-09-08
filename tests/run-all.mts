// Ejecutor de la suite manual del frontend. `npm test` corre este archivo con tsx.
// Filtro opcional:  npm test -- api   /   npm test -- mat-note-04

import "./api.test.mjs";
import "./utils.test.mjs";
import "./toast.test.mjs";
import "./translations.test.mjs";

import { run } from "./harness.mjs";

await run();
