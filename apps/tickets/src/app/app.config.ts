import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { importProvidersFrom } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { ApplicationConfig } from "@angular/platform-browser";
import { PreloadAllModules, provideRouter, withDisabledInitialNavigation, withPreloading } from "@angular/router";
import { APP_ROUTES } from "./app.routes";
import { authConfigCustomApi, authConfigGraph } from "./auth.config";
import { provideOAuthConfig } from "./auth.provider";


export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptorsFromDi()
    ),
    provideRouter(
      APP_ROUTES,
      withPreloading(PreloadAllModules),
      withDisabledInitialNavigation()
    ),
    importProvidersFrom(MatDialogModule),
    provideOAuthConfig(authConfigCustomApi, [/* custom api url */], 'shell', 'shared'),
    provideOAuthConfig(authConfigGraph, ['https://graph.microsoft.com/v1.0'], 'graph', 'shared', true)
  ]
};
