import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

// The appointment detail's one client query, shared by the live status and
// the cancel form: same key, so one cache entry and one request per refresh.
//
// - fallbackData: the page has already read this appointment on the server,
//   so the first paint shows it — no spinner, no request on arrival.
// - refreshInterval: every 10 s while the booking can still change on its own
//   (booked, today or later — reception may check the patient in, and the
//   queue moves). 0 once it is checked in, cancelled or past: nothing left to
//   watch, so the polling stops by itself.
//   (SWR passes the *cached* data, which is empty until the first poll —
//   fallbackData is not cached — so the server's record stands in for it.)
// - revalidateOnMount false: fallbackData *is* the mount's data.
export const appointmentKey = (id) => `/api/appointments/${encodeURIComponent(id)}`;
export const POLL_MS = 10_000;

export function useAppointment(initial) {
  return useSWR(appointmentKey(initial.id), fetcher, {
    fallbackData: { appointment: initial },
    revalidateOnMount: false,
    refreshInterval: (latest) => ((latest ?? { appointment: initial }).appointment.live ? POLL_MS : 0),
  });
}
