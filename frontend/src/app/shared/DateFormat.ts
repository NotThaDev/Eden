/**
 * !! THIS WILL BE THE DEFAULT DATE FORMAT (Month DD YYYY)
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
