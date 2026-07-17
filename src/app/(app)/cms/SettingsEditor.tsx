"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";
import type { Locale } from "@/i18n/dictionaries";
import Link from "next/link";

type Settings = Record<string, unknown>;

const TABS = [
  ["brand", "الهوية والواجهة", "Brand & Hero"],
  ["about", "من نحن", "About"],
  ["services", "الخدمات", "Services"],
  ["faqs", "الأسئلة الشائعة", "FAQs"],
  ["contact", "التواصل والفروع", "Contact"],
  ["legal", "الصفحات القانونية", "Legal"],
  ["seo", "تحسين محركات البحث", "SEO"],
] as const;

export function SettingsEditor({ initial, locale }: { initial: Settings; locale: Locale }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState("brand");
  const [form, setForm] = useState<Settings>(initial);
  const [busy, setBusy] = useState(false);
  const ar = locale === "ar";

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));
  const arr = (key: string): Record<string, unknown>[] => (Array.isArray(form[key]) ? (form[key] as Record<string, unknown>[]) : []);
  const setArr = (key: string, value: Record<string, unknown>[]) => set(key, value);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/cms/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { toast.success(ar ? "تم حفظ محتوى الموقع" : "Website content saved"); router.refresh(); }
      else toast.error(t("common.somethingWentWrong"));
    } finally { setBusy(false); }
  };

  const F = ({ k, label, textarea }: { k: string; label: string; textarea?: boolean }) =>
    textarea ? (
      <Textarea label={label} value={(form[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} rows={3} />
    ) : (
      <Input label={label} value={(form[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} />
    );

  return (
    <>
      <PageHeader
        title={ar ? "محتوى الموقع الإلكتروني" : "Website Content"}
        description={ar ? "تحكّم كامل في محتوى الموقع العام" : "Full control over the public website"}
        action={
          <div className="flex gap-2">
            <Link href="/" target="_blank"><Button variant="secondary" icon={<ExternalLink className="size-4" />}>{ar ? "معاينة" : "Preview"}</Button></Link>
            <Button onClick={save} loading={busy} icon={<Save className="size-4" />}>{t("common.save")}</Button>
          </div>
        }
      />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map(([id, arL, enL]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === id ? "border-primary text-primary" : "border-transparent text-fg-muted hover:text-fg"}`}>
            {ar ? arL : enL}
          </button>
        ))}
      </div>

      <div className="space-y-5 animate-[fade-in_0.2s_ease-out]">
        {tab === "brand" && (
          <>
            <Card><CardHeader title={ar ? "الهوية" : "Brand"} /><CardBody className="grid gap-4 sm:grid-cols-2">
              <F k="brandName_ar" label={ar ? "اسم العلامة (عربي)" : "Brand Name (AR)"} />
              <F k="brandName_en" label={ar ? "اسم العلامة (إنجليزي)" : "Brand Name (EN)"} />
              <F k="tagline_ar" label={ar ? "الشعار (عربي)" : "Tagline (AR)"} />
              <F k="tagline_en" label={ar ? "الشعار (إنجليزي)" : "Tagline (EN)"} />
            </CardBody></Card>
            <Card><CardHeader title={ar ? "القسم الرئيسي (Hero)" : "Hero Section"} /><CardBody className="grid gap-4 sm:grid-cols-2">
              <F k="hero_title_ar" label={ar ? "العنوان (عربي)" : "Title (AR)"} textarea />
              <F k="hero_title_en" label={ar ? "العنوان (إنجليزي)" : "Title (EN)"} textarea />
              <F k="hero_subtitle_ar" label={ar ? "النص الفرعي (عربي)" : "Subtitle (AR)"} textarea />
              <F k="hero_subtitle_en" label={ar ? "النص الفرعي (إنجليزي)" : "Subtitle (EN)"} textarea />
              <F k="hero_ctaLabel_ar" label={ar ? "زر الإجراء (عربي)" : "CTA Label (AR)"} />
              <F k="hero_ctaLabel_en" label={ar ? "زر الإجراء (إنجليزي)" : "CTA Label (EN)"} />
            </CardBody></Card>
            <ArrayEditor title={ar ? "الإحصائيات" : "Stats"} items={arr("stats")} onChange={(v) => setArr("stats", v)} fields={[["value", ar ? "القيمة" : "Value"], ["label_ar", ar ? "التسمية (عربي)" : "Label (AR)"], ["label_en", ar ? "التسمية (إنجليزي)" : "Label (EN)"]]} addLabel={ar ? "إضافة إحصائية" : "Add stat"} />
          </>
        )}

        {tab === "about" && (
          <Card><CardBody className="grid gap-4 sm:grid-cols-2">
            <F k="about_ar" label={ar ? "من نحن (عربي)" : "About (AR)"} textarea />
            <F k="about_en" label={ar ? "من نحن (إنجليزي)" : "About (EN)"} textarea />
            <F k="vision_ar" label={ar ? "الرؤية (عربي)" : "Vision (AR)"} textarea />
            <F k="vision_en" label={ar ? "الرؤية (إنجليزي)" : "Vision (EN)"} textarea />
            <F k="mission_ar" label={ar ? "الرسالة (عربي)" : "Mission (AR)"} textarea />
            <F k="mission_en" label={ar ? "الرسالة (إنجليزي)" : "Mission (EN)"} textarea />
            <F k="history_ar" label={ar ? "تاريخنا (عربي)" : "History (AR)"} textarea />
            <F k="history_en" label={ar ? "تاريخنا (إنجليزي)" : "History (EN)"} textarea />
          </CardBody></Card>
        )}

        {tab === "services" && (
          <ArrayEditor title={ar ? "الخدمات" : "Services"} items={arr("services")} onChange={(v) => setArr("services", v)} fields={[["icon", ar ? "الأيقونة (Bike/Truck/Boxes/Settings)" : "Icon"], ["title_ar", ar ? "العنوان (عربي)" : "Title (AR)"], ["title_en", ar ? "العنوان (إنجليزي)" : "Title (EN)"], ["desc_ar", ar ? "الوصف (عربي)" : "Desc (AR)"], ["desc_en", ar ? "الوصف (إنجليزي)" : "Desc (EN)"]]} addLabel={ar ? "إضافة خدمة" : "Add service"} />
        )}

        {tab === "faqs" && (
          <ArrayEditor title={ar ? "الأسئلة الشائعة" : "FAQs"} items={arr("faqs")} onChange={(v) => setArr("faqs", v)} fields={[["q_ar", ar ? "السؤال (عربي)" : "Question (AR)"], ["q_en", ar ? "السؤال (إنجليزي)" : "Question (EN)"], ["a_ar", ar ? "الإجابة (عربي)" : "Answer (AR)"], ["a_en", ar ? "الإجابة (إنجليزي)" : "Answer (EN)"]]} addLabel={ar ? "إضافة سؤال" : "Add FAQ"} />
        )}

        {tab === "contact" && (
          <>
            <Card><CardHeader title={ar ? "معلومات التواصل" : "Contact Info"} /><CardBody className="space-y-4">
              <ListEditor label={ar ? "أرقام الهواتف" : "Phone numbers"} items={(form.phones as string[]) ?? []} onChange={(v) => set("phones", v)} />
              <ListEditor label={ar ? "عناوين البريد" : "Emails"} items={(form.emails as string[]) ?? []} onChange={(v) => set("emails", v)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <F k="address_ar" label={ar ? "العنوان (عربي)" : "Address (AR)"} />
                <F k="address_en" label={ar ? "العنوان (إنجليزي)" : "Address (EN)"} />
              </div>
              <F k="mapEmbedUrl" label={ar ? "رابط الخريطة (embed)" : "Map embed URL"} />
            </CardBody></Card>
            <ArrayEditor title={ar ? "الفروع" : "Branches"} items={arr("branches")} onChange={(v) => setArr("branches", v)} fields={[["city_ar", ar ? "المدينة (عربي)" : "City (AR)"], ["city_en", ar ? "المدينة (إنجليزي)" : "City (EN)"], ["address_ar", ar ? "العنوان (عربي)" : "Address (AR)"], ["address_en", ar ? "العنوان (إنجليزي)" : "Address (EN)"]]} addLabel={ar ? "إضافة فرع" : "Add branch"} />
            <ArrayEditor title={ar ? "وسائل التواصل الاجتماعي" : "Social Media"} items={arr("social")} onChange={(v) => setArr("social", v)} fields={[["platform", ar ? "المنصة" : "Platform"], ["url", ar ? "الرابط" : "URL"]]} addLabel={ar ? "إضافة رابط" : "Add link"} />
          </>
        )}

        {tab === "legal" && (
          <Card><CardBody className="grid gap-4 sm:grid-cols-2">
            <F k="privacy_ar" label={ar ? "سياسة الخصوصية (عربي)" : "Privacy (AR)"} textarea />
            <F k="privacy_en" label={ar ? "سياسة الخصوصية (إنجليزي)" : "Privacy (EN)"} textarea />
            <F k="terms_ar" label={ar ? "الشروط والأحكام (عربي)" : "Terms (AR)"} textarea />
            <F k="terms_en" label={ar ? "الشروط والأحكام (إنجليزي)" : "Terms (EN)"} textarea />
          </CardBody></Card>
        )}

        {tab === "seo" && (
          <Card><CardBody className="grid gap-4 sm:grid-cols-2">
            <F k="seo_title_ar" label={ar ? "عنوان SEO (عربي)" : "SEO Title (AR)"} />
            <F k="seo_title_en" label={ar ? "عنوان SEO (إنجليزي)" : "SEO Title (EN)"} />
            <F k="seo_description_ar" label={ar ? "وصف SEO (عربي)" : "SEO Description (AR)"} textarea />
            <F k="seo_description_en" label={ar ? "وصف SEO (إنجليزي)" : "SEO Description (EN)"} textarea />
            <div className="sm:col-span-2"><F k="seo_keywords" label={ar ? "الكلمات المفتاحية (مفصولة بفاصلة)" : "Keywords (comma-separated)"} /></div>
          </CardBody></Card>
        )}
      </div>
    </>
  );
}

function ArrayEditor({ title, items, onChange, fields, addLabel }: { title: string; items: Record<string, unknown>[]; onChange: (v: Record<string, unknown>[]) => void; fields: [string, string][]; addLabel: string }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader title={title} action={<Button variant="ghost" size="sm" icon={<Plus className="size-3.5" />} onClick={() => onChange([...items, Object.fromEntries(fields.map((f) => [f[0], ""]))])}>{addLabel}</Button>} />
      <CardBody className="space-y-4">
        {items.length === 0 && <p className="text-sm text-fg-subtle">{t("common.noData")}</p>}
        {items.map((item, i) => (
          <div key={i} className="rounded-lg bg-bg-subtle p-4 ring-1 ring-border">
            <div className="mb-3 flex justify-end">
              <Button variant="ghost" size="icon" className="text-danger" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={t("common.delete")}><Trash2 className="size-4" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map(([key, label]) => (
                <Input key={key} label={label} value={(item[key] as string) ?? ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], [key]: e.target.value }; onChange(n); }} />
              ))}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function ListEditor({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-fg">{label}</label>
        <Button variant="ghost" size="sm" icon={<Plus className="size-3.5" />} onClick={() => onChange([...items, ""])}>{t("common.add")}</Button>
      </div>
      <div className="space-y-2">
        {items.map((val, i) => (
          <div key={i} className="flex gap-2">
            <input value={val} onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n); }} dir="ltr" className="h-10 flex-1 rounded-lg bg-surface px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring focus:outline-none" />
            <Button variant="ghost" size="icon" className="text-danger" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={t("common.delete")}><Trash2 className="size-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
