/**
 * !! THIS WILL BE THE DEFAULT DATE FORMAT (localized full date, e.g. "20 ottobre 2026" with MAT_DATE_LOCALE it-IT)
 *
 * To change the date format on the single component level, provide the
 * `provideLuxonDateAdapter` function with the desired date format.
 * ```
 *    providers: [
 *        provideLuxonDateAdapter(CUSTOM_DATE_FORMATS),
 *    ],
 * ```
 */
export const MONTH_DAY_YEAR_FORMAT = {
  parse: {
    dateInput: 'DDD',
  },
  display: {
    dateInput: 'DDD',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'DDD',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};
