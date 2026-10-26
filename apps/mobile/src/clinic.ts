import {
  followUpSuggestion,
  locationById,
  specialistById,
  treatmentById,
  type ClinicLocation,
  type Appointment,
  type Specialist,
  type SpecialistId,
  type Treatment,
  type TreatmentId,
} from '@pure-clinics/shared';
import { useMemo } from 'react';

import { useDemo } from './state/demo';

export type AppointmentView = Appointment & {
  treatment: Treatment;
  specialist: Specialist;
  location: ClinicLocation;
};

/** Clinic data joined with the member's own appointments, ready for screens. */
export function useClinic() {
  const demo = useDemo();
  return useMemo(() => {
    const view = (a: Appointment): AppointmentView => ({
      ...a,
      treatment: treatmentById(a.treatmentId),
      specialist: specialistById(a.specialistId),
      location: locationById(a.locationId),
    });
    const all = demo.appointments.map(view);
    const now = demo.now.getTime();
    const upcoming = all.filter((a) => a.start.getTime() > now).sort((a, b) => a.start.getTime() - b.start.getTime());
    const past = all.filter((a) => a.start.getTime() <= now).sort((a, b) => b.start.getTime() - a.start.getTime());
    return {
      ...demo,
      upcoming,
      past,
      next: upcoming[0],
      followUp: followUpSuggestion(demo.now, demo.appointments),
      byId: (id: string) => all.find((a) => a.id === id),
      /** Who did this treatment last time, so the booking flow can suggest the same person. */
      lastSpecialistFor: (treatmentId: TreatmentId): SpecialistId | undefined => past.find((a) => a.treatmentId === treatmentId)?.specialistId,
    };
  }, [demo]);
}

/** City names stay left-to-right inside Arabic text, so "'s-Hertogenbosch" keeps its apostrophe in front. */
export function cityName(location: ClinicLocation): string {
  return `\u200E${location.city}`;
}

export function roleKey(role: Specialist['role']) {
  return `clinic.role.${role}` as const;
}
