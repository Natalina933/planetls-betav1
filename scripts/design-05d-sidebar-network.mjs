// À précharger uniquement dans le processus de compilation, avant ses imports.
process.env.PLS_READONLY_E2E = "1";
await import("./readonly-e2e-network.mjs");
