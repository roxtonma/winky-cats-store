import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your favorite store - Winky Cats Store",
  description: "Curated selection of quality clothes from our lineup and an Amazon affiliate store for other needs. As an Amazon Associate we earn from qualifying purchases.",
  keywords: "custom clothes, small business, designer clothes, amazon associates",
}

export default function AssociatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
