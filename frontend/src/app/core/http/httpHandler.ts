import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpHandler {
  // #TODO move this on the env files
  private readonly apiUrl = 'http://localhost:5190';

  private normalizeUrl(url: string): string {
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    return this.apiUrl + url;
  }

  constructor(private http: HttpClient) {}

  // Specific Request Creator
  get<T>(url: string, options?: any, withCredential?: boolean, observe?: string) {
    return this.httRequest<T>(
      'GET',
      this.normalizeUrl(url),
      undefined,
      options,
      withCredential,
      observe
    );
  }

  delete<T>(url: string, options?: any, withCredential?: boolean, observe?: string) {
    return this.httRequest<T>(
      'DELETE',
      this.normalizeUrl(url),
      undefined,
      options,
      withCredential,
      observe
    );
  }

  post<T>(url: string, body: any, options?: any, withCredential?: boolean, observe?: string) {
    return this.httRequest<T>(
      'POST',
      this.normalizeUrl(url),
      body,
      options,
      withCredential,
      observe
    );
  }

  patch<T>(url: string, body: any, options?: any, withCredential?: boolean, observe?: string) {
    return this.httRequest<T>(
      'PATCH',
      this.normalizeUrl(url),
      body,
      options,
      withCredential,
      observe
    );
  }

  put<T>(url: string, body: any, options?: any, withCredential?: boolean, observe?: string) {
    return this.httRequest<T>(
      'PUT',
      this.normalizeUrl(url),
      body,
      options,
      withCredential,
      observe
    );
  }

  httRequest<T>(
    method: string,
    url: string,
    body?: any,
    options?: any,
    withCredential?: boolean,
    observe?: string
  ) {
    method = method.toUpperCase();

    if (method == 'DELETE' || method == 'GET') {
      if (body) {
        throw new Error('Delete And Get do not Require A body');
      }
    } else if (!body) {
      throw new Error('Post, Put and Patch Require A Body for The request');
    }

    if (!options) options = {};

    if (!options.params) options.params = {};

    // #TODO Need to update it once Auth is in place
    if (withCredential) {
      const token = JSON.parse(window.localStorage.getItem('Token') || '{}');
      if (token) {
        if (body) body.token = token;
        else options.params.token = token;
      } else {
        options.withCredential = withCredential;
      }
    }

    if (body) options.body = body;

    if (!observe) {
      observe = 'body';
    }
    options.observe = observe;

    return this.http.request<T>(method, url, options) as Observable<T>;
  }
}
