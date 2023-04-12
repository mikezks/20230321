import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading,
} from '@angular/router';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { provideOAuthSetup, providePrefixOAuthStorage } from './app/auth.config';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(
      APP_ROUTES,
      withPreloading(PreloadAllModules)
    ),
    importProvidersFrom(MatDialogModule),
    provideOAuthClient(),
    provideOAuthSetup(),
    providePrefixOAuthStorage('shell')
  ],
});
