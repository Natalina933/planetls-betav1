import { FileText, House, CircleCheck, Wallet, ArrowRight } from "lucide-react";
import { Card, ButtonLink } from "@/components/ui";
import styles from "./OwnerQuotesPage.module.scss";

export default function OwnerQuotesHeader({loading,count,properties,pending,amount}: {loading:boolean;count:number;properties:number;pending:number;amount:string}) {
  const metrics=[
    {label:"Propositions",value:count,hint:"Avec vos filtres",icon:FileText},
    {label:"Logements suivis",value:properties,hint:"Groupes affichés",icon:House},
    {label:"À arbitrer",value:pending,hint:"Sur les devis chargés",icon:CircleCheck},
    {label:"Montant visible",value:amount,hint:"Sur la sélection affichée",icon:Wallet},
  ];
  return <>
    <header className={styles.hero}><nav aria-label="Fil d’Ariane">Propriétaire <span aria-hidden="true">›</span> Devis et propositions</nav><p className={styles.eyebrow}>Devis et propositions</p><h1>Choisissez votre partenaire sereinement</h1><p>Retrouvez les propositions de vos conciergeries, comparez les prestations et gardez une trace claire de vos décisions.</p><blockquote>« Des séjours sereins, des logements qui performent. »</blockquote></header>
    <section className={styles.metrics} aria-label="Indicateurs des devis">{metrics.map(({label,value,hint,icon:Icon})=><Card className={styles.metric} key={label}><Icon aria-hidden="true"/><div><strong>{loading ? "—" : value}</strong><h2>{label}</h2><p>{hint}</p></div></Card>)}</section>
    <Card className={styles.quickActions}><div><p className={styles.eyebrow}>Actions rapides</p><h2>Faire maintenant</h2></div><ButtonLink href="/dashboard/owner/demandes" className={styles.quickAction} variant="secondary"><FileText aria-hidden="true"/><span><small>Vos besoins</small>Suivre mes demandes</span><ArrowRight aria-hidden="true"/></ButtonLink><ButtonLink href="/dashboard/owner/concierges" className={styles.quickAction} variant="secondary"><House aria-hidden="true"/><span><small>Votre réseau</small>Trouver une conciergerie</span><ArrowRight aria-hidden="true"/></ButtonLink></Card>
  </>;
}
