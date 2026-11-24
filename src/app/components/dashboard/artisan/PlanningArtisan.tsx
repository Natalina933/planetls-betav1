/* Planning Artisan — P2-01
 * Interface de planification pour les artisans/concierges
 * Gestion des interventions et planning de maintenance
 */

import React from "react";
import { Card, CardContent, CardHeader, Text } from "@/components/ui/card";
import { Calendar, CalendarHeader } from "lucide-react";

export const PlanningArtisan: React.FC = () => {
  return (
    <Card className="p-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <Text>Planification Artisan</Text>
        <Calendar className="h-5 w-5" />
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Interface de planification des interventions d'artisans et de maintenance.
        </p>
      </CardContent>
    </Card>
  );
};