import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW server for Node.js/Vitest environment
 * Intercepts HTTP requests at the network level for realistic testing
 */
export const server = setupServer(...handlers);
