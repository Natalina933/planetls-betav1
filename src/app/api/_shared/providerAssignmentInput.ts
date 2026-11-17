/** These client-writable fields must never assert server assignment provenance. */
export function hasAssignmentReference(metadata: unknown): boolean {
  return Boolean(metadata && typeof metadata === "object" && !Array.isArray(metadata)
    && ["mission_id", "missionId", "assignment_id", "mission_provider_assignment_id", "created_from", "concierge_profile_id"]
      .some(key => Object.hasOwn(metadata, key)));
}
