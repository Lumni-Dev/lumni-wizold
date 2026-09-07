import { EmptyState } from "./empty-state";

export function FilteredEmptyState({ description }: { description: string }) {
  return <EmptyState title="Nothing in this filter" description={description} />;
}
