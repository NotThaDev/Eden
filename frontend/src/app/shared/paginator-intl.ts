import { MatPaginatorIntl } from '@angular/material/paginator';

export function italianPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Elementi per pagina';
  intl.nextPageLabel = 'Pagina successiva';
  intl.previousPageLabel = 'Pagina precedente';
  intl.firstPageLabel = 'Prima pagina';
  intl.lastPageLabel = 'Ultima pagina';
  intl.getRangeLabel = (page, pageSize, length) => {
    if (length === 0) {
      return '0 di 0';
    }
    const start = page * pageSize;
    return `${start + 1} – ${Math.min(start + pageSize, length)} di ${length}`;
  };
  return intl;
}
