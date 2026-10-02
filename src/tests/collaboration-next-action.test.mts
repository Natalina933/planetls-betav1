import test from "node:test";
import assert from "node:assert/strict";

import { getCollaborationNextAction } from "../app/api/_shared/collaborationNextAction.ts";

type QueryResult = { data: unknown; error: null };

function dbStub(routes: Record<string, unknown>) {
  return {
    from(table: string) {
      const query: Record<string, unknown> = {
        table,
        filters: [] as string[],
        select() { return query; },
        eq(column: string, value: unknown) {
          (query.filters as string[]).push(`${table}.${column}=${String(value)}`);
          return query;
        },
        order() { return query; },
        limit() { return query; },
        maybeSingle: async (): Promise<QueryResult> => ({ data: routes[table] ?? null, error: null }),
      };
      return query;
    },
  };
}

test("collaboration pending => finaliser le contrat, sans lien sejour", async () => {
  const db = dbStub({ housing_collaborations: { id: "collab-1", status: "pending_handover", service_request_id: "req-1", quote_id: "quote-1" } });
  const action = await getCollaborationNextAction({ db: db as never, quoteId: "quote-1", serviceRequestId: "req-1" });
  assert.equal(action.kind, "finalize_contract");
  assert.equal(action.nextHref, null);
  assert.match(action.nextAction, /finalisez votre contrat/i);
});

test("collaboration active => transmettre un sejour", async () => {
  const db = dbStub({ housing_collaborations: { id: "collab-2", status: "active", service_request_id: "req-2", quote_id: "quote-2" } });
  const action = await getCollaborationNextAction({ db: db as never, quoteId: "quote-2", serviceRequestId: "req-2" });
  assert.equal(action.kind, "transmit_stay");
  assert.match(action.nextHref ?? "", /\/dashboard\/owner\/missions\/voyageurs\?quote=quote-2/);
});

test("sans collaboration, pas de preuve d'activation", async () => {
  const db = dbStub({});
  const action = await getCollaborationNextAction({ db: db as never, quoteId: "quote-3", serviceRequestId: "req-3" });
  assert.equal(action.kind, "finalize_contract");
  assert.equal(action.collaborationId, null);
  assert.equal(action.nextHref, null);
});
