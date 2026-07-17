import { redirect } from "next/navigation";

/** SEO fields live in the settings editor's SEO tab. */
export default function SeoPage() {
  redirect("/cms");
}
