/* Planning Artisan — P2-01
 * Interface de planification pour les artisans/concierges
 * Gestion des interventions et planning de maintenance
 */

import React from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Calendar } from "lucide-react";

export const PlanningArtisan: React.FC = () => {
  return (
    <Card className="p-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <Calendar className="h-5 w-5 mr-2" />
        <span>Planification Artisan</span>
      </CardHeader>
      <CardBody>
        <p className="text-muted-foreground">
          Interface de planification des interventions d'artisans et de maintenance.
        </p>
      </CardBody>
    </Card>
  );
};