import { collectionRoute } from "@/lib/crudFactory";
import { Article } from "@/models/Article";
import { CreateArticleSchema } from "@/lib/validators";
import type { ListSpec } from "@/lib/listQuery";
import type { IArticle } from "@/models/Article";

export const runtime = "nodejs";

export const articleSpec: ListSpec<IArticle> = {
  searchFields: ["title_ar", "title_en", "slug", "tags"],
  filterMap: { published: (v) => ({ published: v === "true" }) },
  sortable: ["title_en", "published", "publishedAt", "createdAt", "views"],
  defaultSort: "createdAt",
};

/** Stamp publishedAt the first time an article is published. */
function stampPublish(data: Record<string, unknown>): Record<string, unknown> {
  if (data.published === true && !data.publishedAt) data.publishedAt = new Date();
  if (data.published === false) data.publishedAt = null;
  return data;
}

export const { GET, POST } = collectionRoute({
  model: Article,
  resource: "cms.articles",
  listSpec: articleSpec,
  createSchema: CreateArticleSchema,
  updateSchema: CreateArticleSchema,
  label: (d) => String(d.title_en ?? d.title_ar ?? ""),
  beforeWrite: (data) => stampPublish(data),
});
