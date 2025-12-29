export enum SnackbarStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
}

export interface SnackbarData {
  title: string;
  status: SnackbarStatus;
  customIcon?: string; // #TODO how can I pass the custom icon?
}
