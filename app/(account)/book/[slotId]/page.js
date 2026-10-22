import { requireUser } from "@/lib/session";

export default async function BookPage({ params }) {
  const { slotId } = await params;
  await requireUser(`/book/${slotId}`);
  return <h1>Book slot {slotId}</h1>;
}
