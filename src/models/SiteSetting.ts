import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * Singleton document holding all editable website content. The super admin edits
 * this from the CMS; the public site reads it. Bilingual fields carry `_ar`/`_en`.
 * Kept as one document so a single fetch renders the whole marketing site.
 */
export interface ISiteSetting {
  _id: Types.ObjectId;
  key: "main";

  brandName_ar: string;
  brandName_en: string;
  tagline_ar: string;
  tagline_en: string;

  hero_title_ar: string;
  hero_title_en: string;
  hero_subtitle_ar: string;
  hero_subtitle_en: string;
  hero_ctaLabel_ar: string;
  hero_ctaLabel_en: string;

  about_ar: string;
  about_en: string;
  vision_ar: string;
  vision_en: string;
  mission_ar: string;
  mission_en: string;
  history_ar: string;
  history_en: string;

  stats: { label_ar: string; label_en: string; value: string }[];
  services: { title_ar: string; title_en: string; desc_ar: string; desc_en: string; icon: string }[];
  faqs: { q_ar: string; q_en: string; a_ar: string; a_en: string }[];

  // Footer / legal pages (rich text as plain markdown-ish string)
  privacy_ar: string;
  privacy_en: string;
  terms_ar: string;
  terms_en: string;

  // Contact & location
  phones: string[];
  emails: string[];
  address_ar: string;
  address_en: string;
  mapEmbedUrl: string;
  branches: { city_ar: string; city_en: string; address_ar: string; address_en: string }[];

  // Social
  social: { platform: string; url: string }[];

  // SEO defaults
  seo_title_ar: string;
  seo_title_en: string;
  seo_description_ar: string;
  seo_description_en: string;
  seo_keywords: string;

  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingSchema = new Schema<ISiteSetting>(
  {
    key: { type: String, default: "main", unique: true },
    brandName_ar: { type: String, default: "الخط الأول" },
    brandName_en: { type: String, default: "First Line" },
    tagline_ar: { type: String, default: "حلول الخدمات اللوجستية والتوصيل" },
    tagline_en: { type: String, default: "Logistics & Delivery Solutions" },
    hero_title_ar: { type: String, default: "نُوصِّل المملكة، طلبًا تلو الآخر" },
    hero_title_en: { type: String, default: "Delivering the Kingdom, order by order" },
    hero_subtitle_ar: { type: String, default: "أكثر من ١٥٠٠ مندوب بسيارات ودراجات آلية يغطون مدن المملكة." },
    hero_subtitle_en: { type: String, default: "Over 1,500 riders and drivers covering cities across Saudi Arabia." },
    hero_ctaLabel_ar: { type: String, default: "الدخول إلى النظام" },
    hero_ctaLabel_en: { type: String, default: "Enter the System" },
    about_ar: { type: String, default: "" },
    about_en: { type: String, default: "" },
    vision_ar: { type: String, default: "" },
    vision_en: { type: String, default: "" },
    mission_ar: { type: String, default: "" },
    mission_en: { type: String, default: "" },
    history_ar: { type: String, default: "" },
    history_en: { type: String, default: "" },
    stats: { type: Schema.Types.Mixed, default: [] },
    services: { type: Schema.Types.Mixed, default: [] },
    faqs: { type: Schema.Types.Mixed, default: [] },
    privacy_ar: { type: String, default: "" },
    privacy_en: { type: String, default: "" },
    terms_ar: { type: String, default: "" },
    terms_en: { type: String, default: "" },
    phones: { type: [String], default: [] },
    emails: { type: [String], default: [] },
    address_ar: { type: String, default: "" },
    address_en: { type: String, default: "" },
    mapEmbedUrl: { type: String, default: "" },
    branches: { type: Schema.Types.Mixed, default: [] },
    social: { type: Schema.Types.Mixed, default: [] },
    seo_title_ar: { type: String, default: "" },
    seo_title_en: { type: String, default: "" },
    seo_description_ar: { type: String, default: "" },
    seo_description_en: { type: String, default: "" },
    seo_keywords: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, minimize: false },
);

export const SiteSetting: Model<ISiteSetting> =
  (models.SiteSetting as Model<ISiteSetting>) || model<ISiteSetting>("SiteSetting", SiteSettingSchema);

export default SiteSetting;
