import { itemRoute } from "@/lib/crudFactory";
import { Article } from "@/models/Article";
import { CreateArticleSchema, UpdateArticleSchema } from "@/lib/validators";
import { articleSpec } from "../route";

export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemRoute({
  model: Article,
  resource: "cms.articles",
  listSpec: articleSpec,
  createSchema: CreateArticleSchema,
  updateSchema: UpdateArticleSchema,
  label: (d) => String(d.title_en ?? d.title_ar ?? ""),
  beforeWrite: (data) => {
    if (data.published === true && !data.publishedAt) data.publishedAt = new Date();
    if (data.published === false) data.publishedAt = null;
    return data;
  },
});
