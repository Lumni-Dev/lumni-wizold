import { EmptyState } from "./empty-state";

export function FilteredEmptyState({ description }: { description: string }) {
  return <EmptyState title="Nada neste filtro" description={description} />;
}
