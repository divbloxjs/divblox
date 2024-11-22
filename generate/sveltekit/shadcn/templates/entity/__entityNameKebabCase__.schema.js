import { z } from "zod";

export const __entityName__CreateSchema = z.object({
    __attributeSchemaDefinition__
});

export const __entityName__UpdateSchema = z.object({
    id: z.number().min(1, "Required"),
    __attributeSchemaDefinition__
});
