import { handler } from "../../../server.mjs";

// Explicit nested route for Vercel. The generic catch-all handles local Node
// routing, while this function ensures the practice ledger is deployed too.
export default handler;
