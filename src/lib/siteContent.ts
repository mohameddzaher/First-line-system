import "server-only";
import { connectDB } from "@/lib/db";
import { SiteSetting, type ISiteSetting } from "@/models/SiteSetting";
import { serialize } from "@/lib/serialize";

/** Loads the singleton site settings, creating it with defaults on first run. */
export async function getSiteSettings(): Promise<ISiteSetting> {
  await connectDB();
  // Upsert atomically so concurrent first-load callers (layout + generateMetadata)
  // don't race to create() and collide on the unique `key` index.
  const doc = await SiteSetting.findOneAndUpdate(
    { key: "main" },
    { $setOnInsert: { key: "main", ...DEFAULT_CONTENT } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return serialize(doc) as ISiteSetting;
}

/** Rich default content so the public site looks complete before any editing. */
export const DEFAULT_CONTENT = {
  stats: [
    { label_ar: "مندوب وسائق", label_en: "Riders & Drivers", value: "1,500+" },
    { label_ar: "مدينة", label_en: "Cities", value: "20+" },
    { label_ar: "شريك", label_en: "Partners", value: "10+" },
    { label_ar: "على مدار الساعة", label_en: "Operations", value: "24/7" },
  ],
  vision_ar: "أن نكون الشريك اللوجستي الأول في المملكة العربية السعودية، ومعيارًا للجودة والموثوقية في خدمات التوصيل والميل الأخير.",
  vision_en: "To be the leading logistics partner in Saudi Arabia and the benchmark for quality and reliability in last-mile delivery.",
  mission_ar: "تمكين الشركات من الوصول إلى عملائها بسرعة وكفاءة عبر أسطول واسع من المناديب المدرَّبين وتقنية تشغيلية متكاملة.",
  mission_en: "Enabling businesses to reach their customers quickly and efficiently through a large fleet of trained riders and an integrated operations platform.",
  about_ar: "شركة الخط الأول شركة سعودية متخصصة في الخدمات اللوجستية وحلول التوصيل والميل الأخير. نعمل مع كبرى منصات التوصيل في المملكة، ونمتلك أسطولًا يضم أكثر من ١٥٠٠ مندوب بسيارات ودراجات آلية يغطون مختلف مدن المملكة على مدار الساعة.",
  about_en: "First Line is a Saudi company specialized in logistics and last-mile delivery solutions. We work with the Kingdom's leading delivery platforms and operate a fleet of over 1,500 riders and drivers covering cities across Saudi Arabia around the clock.",
  history_ar: "منذ تأسيسنا ونحن ننمو عامًا بعد عام لنصبح أحد أبرز مزوّدي خدمات التوصيل في المملكة، مع توسّع مستمر في المدن والشراكات والأسطول.",
  history_en: "Since our founding we have grown year over year into one of the Kingdom's prominent delivery providers, with continuous expansion in cities, partnerships, and fleet.",
  services: [
    { title_ar: "التوصيل والميل الأخير", title_en: "Last-Mile Delivery", desc_ar: "توصيل سريع وموثوق للطلبات من المتاجر والمطاعم إلى العملاء.", desc_en: "Fast, reliable delivery of orders from stores and restaurants to customers.", icon: "Bike" },
    { title_ar: "النقل الثقيل", title_en: "Heavy Transport", desc_ar: "نقل البضائع والشحنات الكبيرة بأسطول من الشاحنات المؤهلة.", desc_en: "Transport of goods and large shipments with a fleet of qualified trucks.", icon: "Truck" },
    { title_ar: "حلول الطرف الثالث (3PL)", title_en: "3PL Solutions", desc_ar: "إدارة كاملة لعمليات التوصيل نيابة عن شركائنا من المنصات.", desc_en: "End-to-end management of delivery operations on behalf of our platform partners.", icon: "Boxes" },
    { title_ar: "إدارة الأسطول", title_en: "Fleet Management", desc_ar: "إدارة احترافية للمركبات والتفويضات والصيانة والتأمين.", desc_en: "Professional management of vehicles, authorizations, maintenance, and insurance.", icon: "Settings" },
  ],
  faqs: [
    { q_ar: "ما المناطق التي تغطونها؟", q_en: "Which areas do you cover?", a_ar: "نغطي أكثر من ٢٠ مدينة في مختلف مناطق المملكة العربية السعودية، ونتوسّع باستمرار.", a_en: "We cover 20+ cities across Saudi Arabia and are continuously expanding." },
    { q_ar: "كيف يمكنني الشراكة معكم؟", q_en: "How can I partner with you?", a_ar: "تواصلوا معنا عبر نموذج التواصل وسيقوم فريقنا بالرد عليكم في أقرب وقت.", a_en: "Contact us through the form and our team will get back to you shortly." },
    { q_ar: "هل توظّفون مناديب؟", q_en: "Are you hiring riders?", a_ar: "نعم، تصفّحوا صفحة الوظائف للاطلاع على الفرص المتاحة.", a_en: "Yes — browse the careers page for open opportunities." },
  ],
  phones: ["+966 12 000 0000"],
  emails: ["info@firstline-sa.com"],
  address_ar: "جدة، المملكة العربية السعودية",
  address_en: "Jeddah, Saudi Arabia",
  branches: [
    { city_ar: "جدة", city_en: "Jeddah", address_ar: "المكتب الرئيسي", address_en: "Head Office" },
    { city_ar: "الرياض", city_en: "Riyadh", address_ar: "فرع الرياض", address_en: "Riyadh Branch" },
  ],
  social: [
    { platform: "twitter", url: "#" },
    { platform: "instagram", url: "#" },
    { platform: "linkedin", url: "#" },
  ],
  seo_title_ar: "الخط الأول | حلول الخدمات اللوجستية والتوصيل في السعودية",
  seo_title_en: "First Line | Logistics & Delivery Solutions in Saudi Arabia",
  seo_description_ar: "شركة الخط الأول للخدمات اللوجستية وحلول التوصيل والميل الأخير في المملكة العربية السعودية.",
  seo_description_en: "First Line — logistics and last-mile delivery solutions across Saudi Arabia.",
  seo_keywords: "توصيل, لوجستيات, الميل الأخير, السعودية, delivery, logistics, last mile, Saudi Arabia",
};
