import type { PhotoKey } from '../brands';
import type { L10n } from '../i18n/locales';
import type { ConcernId, TreatmentId } from './ivy';
import { CONCERN_INFO, TREATMENT_INFO } from './treatment-texts';

/**
 * What pureclinics.nl tells about a treatment, in short: what it is, how it works, how many sessions,
 * recovery, results, aftercare and common questions. Written in our own words for the app (October 2026).
 */
export type TreatmentInfo = {
  /** What it is and who it is for, in two or three sentences. */
  intro: L10n;
  how: L10n;
  /** How many treatments people usually need, e.g. "8–10". */
  sessions?: L10n;
  /** Time between two treatments, e.g. "4–6 weken". */
  interval?: L10n;
  downtime?: L10n;
  results?: L10n;
  aftercare?: L10n[];
  faq?: { q: L10n; a: L10n }[];
};

/** Before-and-after photos the clinic publishes per treatment, with its own VOOR/NA labels. */
export const BEFORE_AFTER: Partial<Record<TreatmentId, PhotoKey[]>> = {
  acne: ['ba-acne-1', 'ba-acne-2', 'ba-acne-3'],
  couperose: ['ba-couperose-1', 'ba-couperose-2', 'ba-couperose-3'],
  ipl: ['ba-ipl-1', 'ba-ipl-2', 'ba-ipl-3'],
  pigment: ['ba-pigment-1', 'ba-pigment-2', 'ba-pigment-3'],
  legveins: ['ba-legveins-1', 'ba-legveins-2'],
  tattoo: ['ba-tattoo-1', 'ba-tattoo-2'],
  prx: ['ba-prx-1', 'ba-prx-2'],
  skinpen: ['ba-skinpen-1', 'ba-skinpen-2'],
  sylfirm: ['ba-sylfirm-1', 'ba-sylfirm-2'],
  xlhair: ['ba-xlhair-1', 'ba-xlhair-2', 'ba-xlhair-3'],
  peel: ['ba-peel-1'],
  deepclean: ['ba-peel-1'],
};

export const treatmentInfo = (id: TreatmentId): TreatmentInfo | undefined => TREATMENT_INFO[id];

/** A short explanation of a skin concern, from the condition pages on pureclinics.nl. */
export const concernInfo = (id: ConcernId): L10n => CONCERN_INFO[id];
