import { FileText, House, CircleCheck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { MetricGroup } from "@/components/ui/StatsCard/MetricGroup";
import { StatsCard } from "@/components/ui/StatsCard/StatsCard";
import { QuickActions } from "@/components/ui/dashboard/QuickActions/QuickActions";

export default function OwnerQuotesHeader({loading,count,properties,pending,amount}: {loading:boolean;count:number;properties:number;pending:number;amount:string}) {
  const metrics=[
    {label:"Propositions",value:count,hint:"Avec vos filtres",icon:FileText},
    {label:"Logements suivis",value:properties,hint:"Groupes affichés",icon:House},
    {label:"À arbitrer",value:pending,hint:"Sur les devis chargés",icon:CircleCheck},
    {label:"Montant visible",value:amount,hint:"Sur la sélection affichée",icon:Wallet},
  ];
  return <>
    <PageHeader variant="illustrated" breadcrumb={<>Propriétaire <span aria-hidden="true">›</span> Devis et propositions</>} eyebrow="Devis et propositions" title="Choisissez votre partenaire sereinement" description="Retrouvez les propositions de vos conciergeries, comparez les prestations et gardez une trace claire de vos décisions." quote="« Des séjours sereins, des logements qui performent. »" />
    <MetricGroup aria-label="Indicateurs des devis">{metrics.map(({label,value,hint,icon:Icon})=><StatsCard layout="summary" key={label} label={label} value={loading ? "—" : String(value)} hint={hint} visual={<Icon aria-hidden="true" />} />)}</MetricGroup>
    <QuickActions variant="shortcuts" actions={[
      { href: "/dashboard/owner/demandes", label: "Suivre mes demandes", description: "Vos besoins", icon: <FileText aria-hidden="true" /> },
      { href: "/dashboard/owner/concierges", label: "Trouver une conciergerie", description: "Votre réseau", icon: <House aria-hidden="true" /> },
    ]} />
  </>;
}
