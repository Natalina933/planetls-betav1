import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("les cartes compactes de suivi peuvent être repliées depuis leur en-tête", async () => {
  const source = await readFile(new URL("../app/dashboard/admin/(product-tech)/developpement/MasterPlanViewer.tsx", import.meta.url), "utf8");

  assert.match(source, /type CompactPanelId = "nextAction" \| "healthChecks"/);
  assert.match(source, /const \[compactPanelOpen, setCompactPanelOpen\] = useState<Record<CompactPanelId, boolean>>/);
  assert.match(source, /controlsId="next-action-panel"/);
  assert.match(source, /controlsId="health-checks-panel"/);
  assert.match(source, /controlsId="deferred-work-panel"/);
  assert.match(source, /function toggleCompactPanel\(panel: CompactPanelId\)/);
  assert.match(source, /toggleCompactPanel\("verificationWork"\)/);
  assert.match(source, /\{compactPanelOpen\.nextAction \? <CardBody id="next-action-panel"/);
  assert.match(source, /progress=\{missionControl\.progressionPct\}/);
});
