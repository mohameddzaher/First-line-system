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
  beforeWrite: (data, ctx) => {
    // Stamp publishedAt only on the transition into published. Testing the
    // incoming payload alone re-stamped it on every save — the edit form sends
    // `published: true` but has no publishedAt field — which silently moved
    // older articles to the top of the public list.
    const alreadyPublished = Boolean(ctx?.existing?.publishedAt);
    if (data.published === true && !data.publishedAt && !alreadyPublished) {
      data.publishedAt = new Date();
    }
    if (data.published === false) data.publishedAt = null;
    return data;
  },
});
