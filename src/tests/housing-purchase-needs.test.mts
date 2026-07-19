import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHousingStockManagement, validateHousingPurchaseNeed } from '../app/lib/housingStock.ts';

test('normalise un besoin achat partage owner concierge', () => {
  const stock = normalizeHousingStockManagement({
    purchase_needs: [{
      id: 'need-1',
      item_name: 'Coussin décoratif',
      width_cm: 57,
      height_cm: 30,
      quantity: 2,
      reported_by: 'Christa',
      contract_rule: 'coordination_only',
      status: 'awaiting_owner_approval',
      product_url: 'https://example.com/coussin',
      approval_limit: 50,
      delivery_destination: 'concierge',
    }],
  });
  assert.equal(stock.purchaseNeeds.length, 1);
  assert.equal(stock.purchaseNeeds[0]?.itemName, 'Coussin décoratif');
  assert.equal(stock.purchaseNeeds[0]?.widthCm, 57);
  assert.equal(stock.purchaseNeeds[0]?.heightCm, 30);
  assert.equal(stock.purchaseNeeds[0]?.reportedBy, 'Christa');
  assert.equal(stock.purchaseNeeds[0]?.contractRule, 'coordination_only');
  assert.equal(stock.purchaseNeeds[0]?.status, 'awaiting_owner_approval');
  assert.equal(stock.purchaseNeeds[0]?.deliveryDestination, 'concierge');
});

test('securise les statuts et destinations inconnus', () => {
  const stock = normalizeHousingStockManagement({
    purchaseNeeds: [{ itemName: 'Lampe', quantity: 0, status: 'paid', contractRule: 'other', deliveryDestination: 'shop' }],
  });
  assert.equal(stock.purchaseNeeds[0]?.quantity, 1);
  assert.equal(stock.purchaseNeeds[0]?.status, 'reported');
  assert.equal(stock.purchaseNeeds[0]?.contractRule, 'unknown');
  assert.equal(stock.purchaseNeeds[0]?.deliveryDestination, 'housing');
});

test('bloque commande sans contrat, depassement et cloture sans preuve', () => {
  const base = normalizeHousingStockManagement({
    purchaseNeeds: [{ itemName: 'Coussin', quantity: 2, status: 'ordered', contractRule: 'unknown' }],
  }).purchaseNeeds[0]!;
  assert.match(validateHousingPurchaseNeed(base) || '', /contrat/i);
  assert.match(validateHousingPurchaseNeed({ ...base, contractRule: 'included', estimatedBudget: 80, approvalLimit: 50 }) || '', /plafond/i);
  assert.match(validateHousingPurchaseNeed({ ...base, contractRule: 'included', status: 'installed' }) || '', /photo/i);
  assert.equal(validateHousingPurchaseNeed({ ...base, contractRule: 'included', status: 'installed', installationPhotoUrl: 'https://example.com/preuve.jpg' }), null);
});
