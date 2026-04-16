import type { TicketPriority } from "$lib/components/app/types.js";

export type LabelTone = "red" | "blue" | "purple" | "gray" | "green";

export const priorityLabels: Record<TicketPriority, string> = {
    p1: "P1",
    p2: "P2",
    p3: "P3",
};

export const getPriorityTone = (priority: TicketPriority): TicketPriority =>
    priority;

export const getIssueKey = (id: string) => `WL-${id.padStart(3, "0")}`;

export const getLabelTone = (label: string): LabelTone => {
    const normalized = label.toLowerCase();

    if (normalized.includes("bug") || normalized.includes("auth")) {
        return "red";
    }

    if (normalized.includes("api") || normalized.includes("infra")) {
        return "blue";
    }

    if (normalized.includes("performance") || normalized.includes("design")) {
        return "purple";
    }

    if (normalized.includes("docs") || normalized.includes("research")) {
        return "gray";
    }

    return "green";
};
