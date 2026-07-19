'use client';
import { useState } from 'react';
import { buildHousingMutationPayload, normalizeHousingRow, type ConciergeHousing, type HousingRow } from '@/types/housing';
import { createStockItemId, validateHousingPurchaseNeed, type HousingPurchaseContractRule, type HousingPurchaseNeed, type HousingPurchaseStatus } from '@/app/lib/housingStock';
import styles from './HousingPurchaseNeedsPanel.module.scss';

type Props={housing:ConciergeHousing;role:'owner'|'concierge';onSaved:(value:ConciergeHousing)=>void};
const statuses:Record<HousingPurchaseStatus,string>={reported:'Signalé',awaiting_contract_check:'Contrat à vérifier',awaiting_owner_approval:'Validation propriétaire',product_selected:'Produit choisi',ordered:'Commandé',delivered:'Livré',installed:'Installé',cancelled:'Annulé'};
const contracts:Record<HousingPurchaseContractRule,string>={unknown:'Contrat non vérifié',included:'Gestion incluse au contrat',coordination_only:'Coordination incluse, achat propriétaire',extra_quote:'Hors contrat : devis complémentaire'};
function blank(role:Props['role']):HousingPurchaseNeed{
 const now=new Date().toISOString();
 return{id:createStockItemId('purchase'),itemName:'',widthCm:null,heightCm:null,quantity:1,room:'',reason:'',photoUrl:'',productUrl:'',estimatedBudget:null,deadline:'',deliveryDestination:'housing',contractRule:'unknown',approvalLimit:null,status:'reported',reportedBy:role==='owner'?'Propriétaire':'Conciergerie',ownerDecisionNote:'',invoiceUrl:'',installationPhotoUrl:'',createdAt:now,updatedAt:now};
}
function urlOk(value:string){if(!value)return true;try{return ['http:','https:'].includes(new URL(value).protocol)}catch{return false}}

export default function HousingPurchaseNeedsPanel({housing,role,onSaved}:Props){
 const[needs,setNeeds]=useState(housing.stockManagement.purchaseNeeds),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 function change<K extends keyof HousingPurchaseNeed>(i:number,key:K,value:HousingPurchaseNeed[K]){setNeeds(all=>all.map((need,n)=>n===i?{...need,[key]:value,updatedAt:new Date().toISOString()}:need))}
 async function save(){
  setMessage('');
  const businessError=needs.map(validateHousingPurchaseNeed).find(Boolean);
  if(businessError){setMessage(businessError);return}
  if(needs.some(n=>[n.photoUrl,n.productUrl,n.invoiceUrl,n.installationPhotoUrl].some(v=>!urlOk(v)))){setMessage('Un lien saisi n’est pas une adresse web valide.');return}
  try{
   setBusy(true);
   const next={...housing,stockManagement:{...housing.stockManagement,purchaseNeeds:needs,lastUpdatedAt:new Date().toISOString()}};
   const res=await fetch(`/api/housing/${housing.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(buildHousingMutationPayload(next))});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data?.error||'Enregistrement impossible.');
   const normalized=normalizeHousingRow(data as HousingRow);
   setNeeds(normalized.stockManagement.purchaseNeeds);onSaved(normalized);setMessage('Suivi enregistré dans la fiche logement.');
  }catch(e){setMessage(e instanceof Error?e.message:'Enregistrement impossible.')}finally{setBusy(false)}
 }
 return <section className={styles.panel}>
  <div className={styles.header}><div><p className={styles.eyebrow}>Préparation et renouvellement</p><h2>Achats à prévoir</h2><p>Le contrat et le plafond doivent être vérifiés avant toute commande.</p></div><button className={styles.secondary} type={'button'} onClick={()=>setNeeds(v=>[...v,blank(role)])}>Ajouter</button></div>
  {!needs.length?<div className={styles.empty}>Aucun achat signalé.</div>:<div className={styles.list}>{needs.map((need,index)=><NeedCard key={need.id} need={need} onChange={(key,value)=>change(index,key,value)} onRemove={()=>setNeeds(v=>v.filter(x=>x.id!==need.id))}/>)}</div>}
  <div className={styles.footer}><p className={styles.hint}>Aucune commande automatique sans accord lorsque le contrat est inconnu ou le plafond dépassé.</p><button className={styles.primary} disabled={busy} type={'button'} onClick={save}>{busy?'Enregistrement…':'Enregistrer'}</button></div>
  {message?<p className={styles.success} role={'status'}>{message}</p>:null}
 </section>
}

type CardProps={need:HousingPurchaseNeed;onChange:<K extends keyof HousingPurchaseNeed>(key:K,value:HousingPurchaseNeed[K])=>void;onRemove:()=>void};
function NeedCard({need:n,onChange,onRemove}:CardProps){
 return <article className={styles.card}>
  <div className={styles.cardHeader}><strong>{n.itemName||'Nouvel équipement'}</strong><span className={styles.badge}>{statuses[n.status]}</span></div>
  <div className={styles.grid}>
   <label><span>Article *</span><input value={n.itemName} onChange={e=>onChange('itemName',e.target.value)} placeholder={'Coussin décoratif'}/></label>
   <label><span>Pièce</span><input value={n.room} onChange={e=>onChange('room',e.target.value)} placeholder={'Salon'}/></label>
   <label><span>Largeur (cm)</span><input type={'number'} min={0} value={n.widthCm??''} onChange={e=>onChange('widthCm',e.target.value?Number(e.target.value):null)}/></label>
   <label><span>Hauteur (cm)</span><input type={'number'} min={0} value={n.heightCm??''} onChange={e=>onChange('heightCm',e.target.value?Number(e.target.value):null)}/></label>
   <label><span>Quantité *</span><input type={'number'} min={1} value={n.quantity} onChange={e=>onChange('quantity',Number(e.target.value)||1)}/></label>
   <label><span>Date limite</span><input type={'date'} value={n.deadline} onChange={e=>onChange('deadline',e.target.value)}/></label>
   <label><span>Budget estimé (€)</span><input type={'number'} min={0} value={n.estimatedBudget??''} onChange={e=>onChange('estimatedBudget',e.target.value?Number(e.target.value):null)}/></label>
   <label><span>Plafond autorisé (€)</span><input type={'number'} min={0} value={n.approvalLimit??''} onChange={e=>onChange('approvalLimit',e.target.value?Number(e.target.value):null)}/></label>
   <label className={styles.wide}><span>Motif et consigne permanente</span><textarea value={n.reason} onChange={e=>onChange('reason',e.target.value)} placeholder={'État constaté et consigne pour les prochains achats…'}/></label>
   <label className={styles.wide}><span>Photo du besoin</span><input type={'url'} value={n.photoUrl} onChange={e=>onChange('photoUrl',e.target.value)} placeholder={'https://…'}/></label>
   <label className={styles.wide}><span>Lien du produit</span><input type={'url'} value={n.productUrl} onChange={e=>onChange('productUrl',e.target.value)} placeholder={'https://…'}/></label>
   <label><span>Règle du contrat</span><select value={n.contractRule} onChange={e=>onChange('contractRule',e.target.value as HousingPurchaseContractRule)}>{Object.entries(contracts).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
   <label><span>Étape</span><select value={n.status} onChange={e=>onChange('status',e.target.value as HousingPurchaseStatus)}>{Object.entries(statuses).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
   <label><span>Livraison</span><select value={n.deliveryDestination} onChange={e=>onChange('deliveryDestination',e.target.value as HousingPurchaseNeed['deliveryDestination'])}><option value={'housing'}>Au logement</option><option value={'concierge'}>Chez la concierge</option><option value={'owner'}>Chez le propriétaire</option></select></label>
   <label><span>Signalé par</span><input value={n.reportedBy} onChange={e=>onChange('reportedBy',e.target.value)} placeholder={'Christa'}/></label>
   <label className={styles.wide}><span>Décision du propriétaire</span><textarea value={n.ownerDecisionNote} onChange={e=>onChange('ownerDecisionNote',e.target.value)} placeholder={'Accord, refus, produit retenu ou conditions…'}/></label>
   <label className={styles.wide}><span>Facture</span><input type={'url'} value={n.invoiceUrl} onChange={e=>onChange('invoiceUrl',e.target.value)} placeholder={'https://…'}/></label>
   <label className={styles.wide}><span>Photo après installation</span><input type={'url'} value={n.installationPhotoUrl} onChange={e=>onChange('installationPhotoUrl',e.target.value)} placeholder={'https://…'}/></label>
  </div>
  <button className={styles.remove} type={'button'} onClick={onRemove}>Retirer</button>
 </article>
}
