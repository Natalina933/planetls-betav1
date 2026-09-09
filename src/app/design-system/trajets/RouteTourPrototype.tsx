"use client";

import { useState } from "react";
import { ArrowRight, Check, Clock3, List, Navigation, Play, Route, Sparkles } from "lucide-react";
import { Alert, Badge, Button, Card, CardBody, StatsCard, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { routeStatusTone, routeTourData, type RouteStop } from "./routeTourData";
import styles from "./RouteTourPrototype.module.scss";

function MockRouteMap({ stops, selectedId, onSelect }: { stops: readonly RouteStop[]; selectedId: string; onSelect: (id: string) => void }) {
    return (
        <div className={styles.mapCanvas} aria-label="Carte fictive de la tournée au Barcarès" role="img">
            <span className={`${styles.mapRoad} ${styles.roadOne}`} aria-hidden="true" />
            <span className={`${styles.mapRoad} ${styles.roadTwo}`} aria-hidden="true" />
            <span className={`${styles.mapRoad} ${styles.roadThree}`} aria-hidden="true" />
            <span className={`${styles.mapRoad} ${styles.roadFour}`} aria-hidden="true" />
            <span className={`${styles.mapRoad} ${styles.roadFive}`} aria-hidden="true" />
            {stops.map((stop) => (
                <button
                    key={stop.id}
                    type="button"
                    className={styles.mapMarker}
                    style={{ left: stop.mapPosition.left, top: stop.mapPosition.top }}
                    data-current={stop.id === selectedId}
                    data-status={stop.status}
                    aria-label={`${stop.order}. ${stop.property}, ${stop.statusLabel}`}
                    aria-pressed={stop.id === selectedId}
                    onClick={() => onSelect(stop.id)}
                >
                    {stop.order}
                </button>
            ))}
        </div>
    );
}

function RouteStopItem({ stop, selected, onSelect }: { stop: RouteStop; selected: boolean; onSelect: (id: string) => void }) {
    return (
        <li className={styles.stop} data-current={selected} data-status={stop.status}>
            <button type="button" className={styles.stopMarker} onClick={() => onSelect(stop.id)} aria-label={`Sélectionner ${stop.property}`} aria-pressed={selected}>
                {stop.status === "done" ? <Check size={17} aria-hidden="true" /> : stop.order}
            </button>
            <button type="button" className={styles.stopCard} onClick={() => onSelect(stop.id)} aria-pressed={selected}>
                <span className={styles.stopHeader}>
                    <span className={styles.stopTime}>{stop.time}</span>
                    <Badge variant={routeStatusTone[stop.status]}>{stop.statusLabel}</Badge>
                </span>
                <strong>{stop.property}</strong>
                <span className={styles.stopMission}>{stop.mission} · {stop.duration}</span>
                <span className={styles.missionAddress}>{stop.address}</span>
                {stop.note ? <span className={styles.missionNote}>{stop.note}</span> : null}
                {stop.travelFromPrevious ? (
                    <span className={styles.segment}>Trajet suivant : {stop.travelFromPrevious} · {stop.distanceFromPrevious}</span>
                ) : null}
            </button>
        </li>
    );
}

export default function RouteTourPrototype() {
    const [selectedId, setSelectedId] = useState<string>(routeTourData.currentStopId);
    const [started, setStarted] = useState(false);
    const [reorganised, setReorganised] = useState(false);

    const selectedStop = routeTourData.stops.find((stop) => stop.id === selectedId) ?? routeTourData.stops[1];
    const selectedIndex = routeTourData.stops.findIndex((stop) => stop.id === selectedId);
    const completedCount = routeTourData.stops.filter((stop) => stop.status === "done").length;

    return (
        <main className={styles.prototype}>
            <header className={styles.hero}>
                <div>
                    <span className={styles.eyebrow}>Prototype concierge · données fictives</span>
                    <h1>Ma tournée aujourd&apos;hui</h1>
                    <p>{routeTourData.dateLabel} · {routeTourData.placeLabel} · {routeTourData.totalMissions} missions · {routeTourData.totalDistance} · environ {routeTourData.totalDuration}</p>
                </div>
                <div className={styles.heroActions}>
                    <Button variant="primary" onClick={() => setStarted((value) => !value)}>
                        <Play size={16} aria-hidden="true" />
                        {started ? "Tournée démarrée" : "Démarrer la tournée"}
                    </Button>
                    <Button variant="ghost"><List size={16} aria-hidden="true" /> Voir le planning</Button>
                </div>
            </header>

            <Card variant="large" className={styles.nextMission}>
                <CardBody className={styles.nextCopy}>
                    <div className={styles.nextHeading}>
                        <div>
                            <span className={styles.sectionEyebrow}>À faire maintenant</span>
                            <h2>Prochaine mission</h2>
                        </div>
                        <Badge variant="info">{routeTourData.nextMission.status}</Badge>
                    </div>
                    <h3>{routeTourData.nextMission.property}</h3>
                    <p>{routeTourData.nextMission.time} · {routeTourData.nextMission.mission}</p>
                    <p className={styles.missionAddress}>{routeTourData.nextMission.address}</p>
                    <div className={styles.missionMeta}>
                        <Badge variant="neutral"><Clock3 size={14} aria-hidden="true" /> {routeTourData.nextMission.duration}</Badge>
                        <Badge variant="neutral"><Navigation size={14} aria-hidden="true" /> {routeTourData.nextMission.travel}</Badge>
                    </div>
                    <div className={styles.actions}>
                        <Button variant="primary" onClick={() => setSelectedId(routeTourData.currentStopId)}>Ouvrir la mission <ArrowRight size={16} aria-hidden="true" /></Button>
                        <Button variant="outline">Itinéraire <Navigation size={16} aria-hidden="true" /></Button>
                    </div>
                </CardBody>
                <div className={styles.nextDetails} aria-label="Détails de la prochaine mission">
                    <div className={styles.detailItem}><strong>{selectedStop.time}</strong><span>Heure prévue</span></div>
                    <div className={styles.detailItem}><strong>{selectedStop.duration}</strong><span>Temps sur place</span></div>
                    <div className={styles.detailItem}><strong>{completedCount}/{routeTourData.totalMissions}</strong><span>Missions réalisées</span></div>
                    <div className={styles.detailItem}><strong>{routeTourData.currentMargin}</strong><span>Marge actuelle</span></div>
                    <div className={styles.progressBlock}>
                        <div className={styles.progressLabel}><span>Progression de la tournée</span><strong>{Math.round((completedCount / routeTourData.totalMissions) * 100)}%</strong></div>
                        <span className={styles.progressTrack} role="progressbar" aria-label="Progression de la tournée" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((completedCount / routeTourData.totalMissions) * 100)}><span style={{ width: `${(completedCount / routeTourData.totalMissions) * 100}%` }} /></span>
                    </div>
                </div>
            </Card>

            <section className={styles.metrics} aria-label="Indicateurs de tournée">
                <StatsCard label="Missions aujourd'hui" value="6" hint="2 déjà réalisées" visual={<Route size={18} />} visualLabel="Missions" />
                <StatsCard label="Distance estimée" value="31 km" hint="Boucle optimisée" visual={<Navigation size={18} />} visualLabel="Distance" />
                <StatsCard label="Durée totale" value="4 h 20" hint="Missions et déplacements" visual={<Clock3 size={18} />} visualLabel="Durée" />
                <StatsCard label="Marge actuelle" value="12 min" hint="Avant le prochain retard" visual={<Sparkles size={18} />} visualLabel="Marge" />
            </section>

            <Alert tone="warning" title="Retard estimé : 15 minutes" announcement="polite" action={<Button variant="outline" size="sm" onClick={() => setReorganised((value) => !value)}>{reorganised ? "Ordre réorganisé" : "Réorganiser la tournée"}</Button>}>
                Le retard risque d&apos;affecter la mission Résidence Marina prévue à 11:20.
            </Alert>

            <section className={styles.workspace} aria-labelledby="route-workspace-title">
                <div className={styles.sectionHeading}>
                    <div><span className={styles.sectionEyebrow}>Vue opérationnelle</span><h2 id="route-workspace-title">Votre parcours, en un regard</h2></div>
                    <Badge variant="neutral">{selectedIndex + 1} / {routeTourData.totalMissions} sélectionnée</Badge>
                </div>
                <Tabs defaultValue="tournee" className={styles.viewTabs}>
                    <TabsList aria-label="Vues de la tournée">
                        <TabsTrigger value="tournee"><Route size={15} aria-hidden="true" /> Tournée</TabsTrigger>
                        <TabsTrigger value="planning"><List size={15} aria-hidden="true" /> Planning</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tournee">
                        <div className={styles.workspaceGrid}>
                            <section className={styles.mapPanel} aria-labelledby="map-title">
                                <div className={styles.routeHeader}><div><span className={styles.sectionEyebrow}>Carte / ordre conseillé</span><h2 id="map-title">Le Barcarès</h2></div><Badge variant="success">Optimisé</Badge></div>
                                <MockRouteMap stops={routeTourData.stops} selectedId={selectedId} onSelect={setSelectedId} />
                                <div className={styles.mapLegend} aria-label="Légende de la carte">
                                    <span className={styles.legendItem}><i className={styles.legendDot} data-tone="current" /> Sélectionnée</span>
                                    <span className={styles.legendItem}><i className={styles.legendDot} /> Étape</span>
                                    <span className={styles.legendItem}><i className={styles.legendDot} data-tone="warning" /> Retard</span>
                                    <span className={styles.legendItem}><i className={styles.legendDot} data-tone="danger" /> Urgence</span>
                                </div>
                            </section>
                            <section className={styles.timelinePanel} aria-labelledby="timeline-title">
                                <div className={styles.routeHeader}><div><span className={styles.sectionEyebrow}>Déroulé de la journée</span><h2 id="timeline-title">6 étapes</h2></div><span className={styles.routeMeta}>{completedCount} terminée{completedCount > 1 ? "s" : ""}</span></div>
                                <ol className={styles.timeline}>{routeTourData.stops.map((stop) => <RouteStopItem key={stop.id} stop={stop} selected={stop.id === selectedId} onSelect={setSelectedId} />)}</ol>
                            </section>
                        </div>
                    </TabsContent>
                    <TabsContent value="planning">
                        <section className={styles.timelinePanel} aria-label="Planning détaillé de la tournée">
                            <div className={styles.routeHeader}><div><span className={styles.sectionEyebrow}>Planning horaire</span><h2>Une journée lisible</h2></div><Badge variant="neutral">Jeudi 9 septembre</Badge></div>
                            <ol className={styles.timeline}>{routeTourData.stops.map((stop) => <RouteStopItem key={stop.id} stop={stop} selected={stop.id === selectedId} onSelect={setSelectedId} />)}</ol>
                        </section>
                    </TabsContent>
                </Tabs>
            </section>

            <section className={styles.optimisation} aria-labelledby="optimisation-title">
                <div className={styles.optimisationHeader}><span className={styles.sectionEyebrow}>Aide à la décision</span><h2 id="optimisation-title">Itinéraire optimisé</h2><p>L&apos;ordre actuel permet d&apos;économiser environ <strong>{routeTourData.initialOrderSaving}</strong> par rapport à l&apos;ordre initial.</p></div>
                <Button variant="ghost">Voir l&apos;ordre initial</Button>
            </section>
        </main>
    );
}
