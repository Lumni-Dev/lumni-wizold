import type { AttributeKey } from "./attribute";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  attribute: AttributeKey;
}
