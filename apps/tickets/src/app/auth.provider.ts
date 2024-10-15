import { HTTP_INTERCEPTORS, HttpInterceptor } from '@angular/common/http';
import { APP_INITIALIZER, createEnvironmentInjector, ENVIRONMENT_INITIALIZER, EnvironmentInjector, EnvironmentProviders, inject, Injectable, InjectionToken, makeEnvironmentProviders, Provider } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthConfig, DefaultOAuthInterceptor, OAuthService, OAuthStorage, provideOAuthClient } from 'angular-oauth2-oidc';
import { BehaviorSubject, filter, from, Observable, startWith, switchMap, take, tap } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private oauthService = inject(OAuthService);
  private graphOAuthService = injectGraphOAuthService();

  get username(): string {
    const claims = this.oauthService.getIdentityClaims();
    return claims ? claims['name'] : null;
  }

  async login(): Promise<void> {
    this.oauthService.initLoginFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  isAllowed(): boolean {
    return (this.graphOAuthService.getGrantedScopes() as string[])
      ?.includes('https://graph.microsoft.com/User.Read');
  }
}

export function authGuard(): UrlTree | boolean {
  return inject(AuthService).isAllowed() || inject(Router).createUrlTree(['/home']);
}

const REFRESH_TOKEN_KEY = 'refresh_token';

export function providePrefixOAuthStorage(appKey = 'shell', shareRefreshPrefix = ''): EnvironmentProviders {
  const composeKey = (key: string) => key === REFRESH_TOKEN_KEY
    ? `${ shareRefreshPrefix || appKey }-${ key }`
    : `${ appKey }-${ key }`;

  return makeEnvironmentProviders([{
    provide: OAuthStorage,
    useValue: {
      getItem: (key: string): string | null =>
        sessionStorage.getItem(composeKey(key)),
      removeItem: (key: string): void => {
        sessionStorage.removeItem(composeKey(key));
      },
      setItem: (key: string, data: string): void => {
        sessionStorage.setItem(composeKey(key), data);
      }
    } as OAuthStorage
  }]);
}

export const GRAPH_INJECTOR = new InjectionToken<BehaviorSubject<EnvironmentInjector>>('GRAPH_INJECTOR', {
  providedIn: 'root',
  factory: (injector = inject(EnvironmentInjector)) => new BehaviorSubject<EnvironmentInjector>(injector)
});

export function injectGraphOAuthService(): OAuthService {
  return inject(GRAPH_INJECTOR).value.get(OAuthService);
}

export const noopInterceptor: HttpInterceptor = { intercept: (req, next) => next.handle(req) };

export const DYN_AUTH_INTERCEPTOR = new InjectionToken<BehaviorSubject<HttpInterceptor>>('DYN_AUTH_INTERCEPTOR', {
  providedIn: 'root',
  factory: () => new BehaviorSubject<HttpInterceptor>(noopInterceptor)
});

export const ROOT_OAUTH_SERVICE = new InjectionToken<OAuthService>('ROOT_OAUTH_SERVICE');

export function provideRootOAuthService(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ROOT_OAUTH_SERVICE,
      useExisting: OAuthService
    }
  ]);
}

export function provideDynamicAuthInterceptorInit(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: HTTP_INTERCEPTORS,
      multi: true,
      useFactory: (
        dynAuth = inject(DYN_AUTH_INTERCEPTOR)
      ) => ({
        intercept: (req, next) => dynAuth.value.intercept(req, next)
      } as HttpInterceptor)
    }
  ]);
}

export function provideDynamicAuthInterceptorAssignment(): EnvironmentProviders {
  return makeEnvironmentProviders([
    DefaultOAuthInterceptor,
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: (
        dynAuth = inject(DYN_AUTH_INTERCEPTOR),
        defaultOAuthInterceptor = inject(DefaultOAuthInterceptor)
      ) => () => dynAuth.next(defaultOAuthInterceptor)
    }
  ]);
}

export function provideAuthConfig(config: AuthConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: AuthConfig,
      useValue: config
    }
  ]);
}

export function configureOAuthSilentRefresh(authService: OAuthService, config: AuthConfig): Observable<void> {
  return from((async () => {
    authService.configure(config);
    await authService.loadDiscoveryDocumentAndTryLogin();
    authService.setupAutomaticSilentRefresh();
  })());
}

export function configureOAuthUseRefreshToken(authService: OAuthService, config: AuthConfig): Observable<void> {
  return from((async () => {
    authService.configure(config);
    await authService.loadDiscoveryDocumentAndTryLogin();
    if (authService.getRefreshToken()) {
      await authService.refreshToken();
    }
  })());
}

export function createGraphApiInjector(
  injector: EnvironmentInjector,
  providers: EnvironmentProviders[]
): Observable<boolean> {
  const appInitAllowed = new BehaviorSubject(false);
  let graphInjectorSubject = new BehaviorSubject(injector);

  const graphInjector = createEnvironmentInjector([
    providers,
    provideDynamicAuthInterceptorAssignment(),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: (
        rootOAuthService = inject(ROOT_OAUTH_SERVICE),
        oAuthService = inject(OAuthService),
        authConfig = inject(AuthConfig),
        graphInjectorToken = inject(GRAPH_INJECTOR)
      ) => () => {
        graphInjectorSubject = graphInjectorToken;

        rootOAuthService.events.pipe(
          startWith({ type: 'token_received' }),
          filter(oAuthEvent => oAuthEvent.type === 'token_received'),
          switchMap(() => configureOAuthUseRefreshToken(oAuthService, authConfig))
        ).subscribe(() => appInitAllowed.next(true))
      }
    }
  ], injector);

  graphInjectorSubject.next(graphInjector);

  return appInitAllowed.asObservable().pipe(
    filter(isAllowed => isAllowed),
    take(1),
  );
}

export function provideOAuthConfigUseRefreshToken(...providers: EnvironmentProviders[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideDynamicAuthInterceptorInit() as unknown as Provider,
    provideRootOAuthService() as unknown as Provider,
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (
        injector = inject(EnvironmentInjector),
        oAuthService = inject(OAuthService),
        authConfig = inject(AuthConfig),
        router = inject(Router)
      ) => () => configureOAuthSilentRefresh(oAuthService, authConfig).pipe(
        switchMap(() => createGraphApiInjector(injector, providers)),
        tap(() => router.initialNavigation())
      )
    }
  ]);
}

export function provideOAuthConfig(
  config: AuthConfig,
  allowedUrls: string[],
  storageAppKey = 'shell',
  storageShareRefreshPrefix = '',
  useRefreshToken = false
): EnvironmentProviders {
  return !useRefreshToken ? makeEnvironmentProviders([
    provideAuthConfig(config) as unknown as Provider,
    provideOAuthClient({
      resourceServer: {
        sendAccessToken: true,
        allowedUrls
      }
    }) as unknown as Provider,
    providePrefixOAuthStorage(storageAppKey, storageShareRefreshPrefix) as unknown as Provider
  ]) : provideOAuthConfigUseRefreshToken(
    provideAuthConfig(config),
    provideOAuthClient({
      resourceServer: {
        sendAccessToken: true,
        allowedUrls
      }
    }),
    providePrefixOAuthStorage(storageAppKey, storageShareRefreshPrefix),
  );
}
