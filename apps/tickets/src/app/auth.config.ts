import { AuthConfig } from "angular-oauth2-oidc";

export const authConfigGraph: AuthConfig = {
  issuer: 'https://login.microsoftonline.com/<your tenant id>/v2.0',
  redirectUri: window.location.origin + '/flight-booking/flight-search',
  clientId: 'your app id',
  responseType: 'code',
  scope: 'openid profile email offline_access https://graph.microsoft.com/User.Read',
  strictDiscoveryDocumentValidation: false
};

export const authConfigCustomApi: AuthConfig = {
  issuer: 'https://login.microsoftonline.com/<your tenant id>/v2.0',
  redirectUri: window.location.origin + '/flight-booking/flight-search',
  clientId: 'your app id',
  responseType: 'code',
  scope: 'openid profile email offline_access api://<hash>/task.read',
  strictDiscoveryDocumentValidation: false
};
