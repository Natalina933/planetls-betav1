// components/dashboard/JobList.tsx
import React from "react";
import type { Job } from "@/app/dashboard/provider/page";

interface JobListProps {
    jobs: Job[];
}

export default function JobList({ jobs }: JobListProps) {
    if (!jobs || jobs.length === 0) {
        return <p>Aucun chantier à afficher pour le moment.</p>;
    }

    return (
        <div className="job-list">
            {jobs.map((job) => (
                <div key={job.id} className="job-card">
                    <h3>{job.title}</h3>
                    <p>{job.description || "Pas de description"}</p>
                    <p>
                        <strong>Service :</strong> {job.service || "Non spécifié"}
                    </p>
                    <p className={`status ${job.status || "pending"}`}>
                        {job.status || "En attente"}
                    </p>
                </div>
            ))}
        </div>
    );
}
