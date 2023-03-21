import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders, inject, Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://login.microsoftonline.com/<your tenant id>/v2.0',
  redirectUri: window.location.origin + '/flight-booking/flight-search',
  clientId: 'your app id',
  responseType: 'code',
  scope: 'openid profile email offline_access',
  strictDiscoveryDocumentValidation: false
};

export function provideOAuthSetup(): EnvironmentProviders {
  return makeEnvironmentProviders([{
    provide: APP_INITIALIZER,
    useFactory: (oauthService = inject(OAuthService)) => async () => {
      oauthService.configure(authConfig);
      await oauthService.loadDiscoveryDocumentAndTryLogin();
      console.log(
        oauthService.getIdentityClaims(),
        oauthService.getGrantedScopes()
      );
    },
    multi: true
  }]);
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  #oauthService = inject(OAuthService);

  get username(): string {

    const claims = this.#oauthService.getIdentityClaims();
    return claims ? claims['name'] : null;
  }

  login(): void {
    this.#oauthService.initLoginFlow();
  }

  logout(): void {
    this.#oauthService.logOut();
  }

  isAllowed(): boolean {
    return (this.#oauthService.getGrantedScopes() as string[])
      ?.includes('User.Read');
  }
}

export function authGuard(): UrlTree | boolean {
  return inject(AuthService).isAllowed() || inject(Router).createUrlTree(['/home']);
}

/* const isAllowed = signal(false);
computed(() => counter() % 2)
effect(() => console.log(isAllowed(), firstname(), street()));

isAllowed.set(true); */
