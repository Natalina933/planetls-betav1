import assert from "node:assert/strict";
import test from "node:test";
import { insertMissionWithOptionalMetadata } from "../app/api/_shared/missionInsert.ts";

test("mission insert falls back from title to legacy service_label", async () => {
  const payloads: Array<Record<string, unknown>> = [];
  const selects: string[] = [];

  const client = {
    from(table: "missions") {
      assert.equal(table, "missions");
      return {
        insert(payload: Record<string, unknown>) {
          payloads.push(payload);
          return {
            select(columns: string) {
              selects.push(columns);
              return {
                async single() {
                  if (payloads.length === 1) {
                    return {
                      data: null,
                      error: {
                        code: "PGRST204",
                        message: "Could not find the 'title' column of 'missions' in the schema cache",
                      },
                    };
                  }
                  return { data: { id: "mission-1", service_label: payload.service_label }, error: null };
                },
              };
            },
          };
        },
      };
    },
  };

  const result = await insertMissionWithOptionalMetadata(client, { title: "Accueil voyageurs" }, "id, title");

  assert.equal(result.error, null);
  assert.deepEqual(result.removedColumns, ["title"]);
  assert.deepEqual(payloads[1], { service_label: "Accueil voyageurs" });
  assert.equal(selects[1], "id, service_label");
});
