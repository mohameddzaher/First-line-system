import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IArticle {
  _id: Types.ObjectId;
  slug: string;
  title_ar: string;
  title_en: string;
  excerpt_ar?: string;
  excerpt_en?: string;
  body_ar: string;
  body_en: string;
  coverImage?: string;
  tags: string[];
  published: boolean;
  publishedAt?: Date | null;
  views: number;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    title_ar: { type: String, required: true, trim: true },
    title_en: { type: String, required: true, trim: true },
    excerpt_ar: { type: String, trim: true },
    excerpt_en: { type: String, trim: true },
    body_ar: { type: String, default: "" },
    body_en: { type: String, default: "" },
    coverImage: { type: String, trim: true },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    views: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

ArticleSchema.index({ title_ar: "text", title_en: "text", tags: "text" });

export const Article: Model<IArticle> =
  (models.Article as Model<IArticle>) || model<IArticle>("Article", ArticleSchema);

export default Article;
