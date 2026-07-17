import { itemRoute } from "@/lib/crudFactory";
import { Accident } from "@/models/Accident";
import { CreateAccidentSchema, UpdateAccidentSchema } from "@/lib/validators";
import { accidentSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Accident,
  resource: "fleet.accidents",
  listSpec: accidentSpec,
  createSchema: CreateAccidentSchema,
  updateSchema: UpdateAccidentSchema,
  label: (d) => `accident ${d.reportNumber ?? ""}`,
  beforeWrite: (data) => {
    if (data.employee === "") data.employee = null;
    return data;
  },
});
