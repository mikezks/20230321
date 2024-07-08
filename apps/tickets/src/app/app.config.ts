import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { importProvidersFrom } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { ApplicationConfig } from "@angular/platform-browser";
import { provideRouter, withPreloading, PreloadAllModules } from "@angular/router";
import { provideOAuthClient } from "angular-oauth2-oidc";
import { APP_ROUTES } from "./app.routes";
import { provideOAuthSetup, providePrefixOAuthStorage } from "./auth.config";


export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptorsFromDi()
    ),
    provideRouter(
      APP_ROUTES,
      withPreloading(PreloadAllModules)
    ),
    importProvidersFrom(MatDialogModule),
    provideOAuthClient({
      resourceServer: {
        sendAccessToken: true,
        allowedUrls: [
          'https://graph.microsoft.com/v1.0'
        ]
      }
    }),
    provideOAuthSetup(),
    providePrefixOAuthStorage('shell')
  ],
};
