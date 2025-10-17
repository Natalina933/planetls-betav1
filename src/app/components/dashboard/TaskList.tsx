import React from "react";

export interface Task {
    id: string;
    title: string;
    description?: string | null;
    status?: "pending" | "in_progress" | "done";
}

interface TaskListProps {
    tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
    if (!tasks || tasks.length === 0) {
        return <p>Aucune tâche pour le moment.</p>;
    }

    return (
        <div className="task-list">
            {tasks.map((task) => (
                <div key={task.id} className={`task-card ${task.status || "pending"}`}>
                    <h4>{task.title}</h4>
                    <p>{task.description || "Aucune description"}</p>
                    <span className="status">{task.status || "En attente"}</span>
                </div>
            ))}
        </div>
    );
}
