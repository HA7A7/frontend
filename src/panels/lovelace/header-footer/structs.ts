import { array, dynamic, number, object, optional, string } from "superstruct";
import { actionConfigStruct } from "../editor/structs/action-struct";
import { entitiesConfigStruct } from "../editor/structs/entities-struct";
import { LovelaceHeaderFooterConfig } from "./types";

export const pictureHeaderFooterConfigStruct = object({
  type: string(),
  image: string(),
  tap_action: optional(actionConfigStruct),
  hold_action: optional(actionConfigStruct),
  double_tap_action: optional(actionConfigStruct),
});

export const buttonsHeaderFooterConfigStruct = object({
  type: string(),
  entities: array(entitiesConfigStruct),
});

export const graphHeaderFooterConfigStruct = object({
  type: string(),
  entity: string(),
  detail: optional(number()),
  hours_to_show: optional(number()),
});

export const headerFooterConfigStructs = dynamic<any>((value) => {
  if (value && typeof value === "object" && "type" in value) {
    switch ((value as LovelaceHeaderFooterConfig).type!) {
      case "buttons": {
        return buttonsHeaderFooterConfigStruct;
      }
      case "graph": {
        return graphHeaderFooterConfigStruct;
      }
      case "picture": {
        return pictureHeaderFooterConfigStruct;
      }
    }
  }

  // No "type" property => we fallback to one random variant, which ensure that user gets informed
  // about missing "type", as all variants have that marked as required.
  return pictureHeaderFooterConfigStruct;
});
