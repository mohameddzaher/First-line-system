"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/provider";

export function ContactForm() {
  const { locale } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(locale === "ar" ? "تم إرسال رسالتك بنجاح" : "Message sent successfully", locale === "ar" ? "سنتواصل معك قريبًا." : "We'll get back to you soon.");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else if (res.status === 429) {
        toast.error(locale === "ar" ? "محاولات كثيرة، حاول لاحقًا" : "Too many attempts, try later");
      } else {
        toast.error(locale === "ar" ? "تعذّر الإرسال" : "Could not send");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-bold text-fg">{locale === "ar" ? "أرسل لنا رسالة" : "Send us a message"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={locale === "ar" ? "الاسم" : "Name"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input type="email" label={locale === "ar" ? "البريد الإلكتروني" : "Email"} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={locale === "ar" ? "الهاتف" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
        <Input label={locale === "ar" ? "الموضوع" : "Subject"} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      </div>
      <Textarea label={locale === "ar" ? "الرسالة" : "Message"} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} required />
      <Button type="submit" loading={busy} icon={<Send className="size-4" />} className="w-full sm:w-auto">
        {locale === "ar" ? "إرسال" : "Send Message"}
      </Button>
    </form>
  );
}
