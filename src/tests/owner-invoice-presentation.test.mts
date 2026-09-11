import {test} from "node:test";
import assert from "node:assert/strict";
import {invoiceTotals,invoiceAmount,invoiceStatusLabel} from "../app/dashboard/owner/factures/invoicePresentation.ts";

test("invoice totals separate currencies and exclude drafts/canceled without fabricating payments", () => {
  const row = {status:"issued",total_amount:100,paid_amount:40,balance_amount:60,currency:"EUR"};
  const totals=invoiceTotals([row,{...row,currency:"USD"},{...row,status:"canceled"},{...row,status:"draft"}]);
  assert.deepEqual(totals,[{currency:"EUR",total:100,paid:40,balance:60},{currency:"USD",total:100,paid:40,balance:60}]);
  assert.equal(invoiceTotals([row,{...row,paid_amount:null}])[0].paid,null);
  assert.equal(invoiceAmount(null),"—");
  assert.equal(invoiceStatusLabel("partially_paid"),"Partiellement réglée");
});
