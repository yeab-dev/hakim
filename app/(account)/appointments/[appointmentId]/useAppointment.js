import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export const appointmentKey = (id) => `/api/appointments/${encodeURIComponent(id)}`;
export const POLL_MS = 10_000;

export function useAppointment(initial) {
  return useSWR(appointmentKey(initial.id), fetcher, {
    fallbackData: { appointment: initial },
    revalidateOnMount: false,
    refreshInterval: (latest) => ((latest ?? { appointment: initial }).appointment.live ? POLL_MS : 0),
  });
}
