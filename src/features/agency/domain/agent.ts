import type { AgentId } from "@/features/properties/domain/property";

/** HousySpace agent (team pages, listing contact). Mobilia roles are internal and not kept. */
// A type alias (not an interface) so it is assignable to the loader's `Record<string, unknown>`.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type Agent = {
  readonly id: AgentId;
  readonly name: string;
  readonly email?: string | undefined;
};
