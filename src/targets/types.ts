import type { Static, TSchema } from "elysia";
export interface Target<Id extends string, DataType extends TSchema> {
  id: Id;
  fn: (data: Static<DataType>) => void;
  Type: DataType;
}

export function create_target<Id extends string, DataType extends TSchema>(
  options: Target<Id, DataType>,
) {
  return options;
}
