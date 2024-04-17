import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { OktaAuth, toRelativeUrl, type AuthState } from '@okta/okta-auth-js';
import { LoginCallback, Security, useOktaAuth } from '@okta/okta-react';
import type { AuthProvider } from '@interopio/manager-admin-ui';

interface OktaProviderProps {
  oktaAuth: OktaAuth;
  defaultOriginalUrl?: string;
  children: ReactNode;
}

/**
 * This component is a wrapper around `Security` that initiates login via redirect
 * and only renders its children when the user has authenticated.
 *
 * This is done because if we render the AdminUI before the browser is redirected to the original url,
 * `react-router-dom will` not detect a url change via `history.replaceState` and instead
 * we will have to do a top level navigation via `location.href = ...`.
 *
 * TLDR: We authenticate before we render so that we don't have an extra page refresh.
 * @param oktaAuth
 * @param defaultOriginalUrl
 * @param children
 */
export const CustomOktaProvider = ({
  oktaAuth,
  defaultOriginalUrl,
  children,
}: OktaProviderProps) => {
  const [authState, setAuthState] = useState<AuthState | null>(null);

  const restoreOriginalUri = useCallback(
    (oktaAuth: OktaAuth, originalUri: string) => {
      history.replaceState(
        null,
        '',
        toRelativeUrl(originalUri || defaultOriginalUrl, window.location.origin)
      );
    },
    []
  );

  const signInWithInProgressRef = useRef(false);

  useEffect(() => {
    // authState has not initialized yet.
    // This may stay this way for a few renders while the provider is being setup.
    if (!authState) {
      return;
    }

    // If we have initiated a redirect already.
    if (signInWithInProgressRef.current) {
      return;
    }

    // This should exist if correctly configured.
    if (!oktaAuth.options.redirectUri) {
      throw new Error('oktaAuth.options.redirectUri is falsy');
    }

    // If we are on the redirect url of our app - let `LoginCallback` do its work.
    // After that `restoreOriginalUri` will be called and will redirect to the correct place iun our app.
    if (location.href.startsWith(oktaAuth.options.redirectUri)) {
      return;
    }

    if (!authState.isAuthenticated) {
      // It's ok that we never flip it back to false because this happens immediately before top level navigation.
      // The point is that we don't call `signInWithRedirect` more that once.
      signInWithInProgressRef.current = true;

      void oktaAuth.signInWithRedirect({
        originalUri: location.pathname, // Where to redirect back to after auth is done. Will be passed to `restoreOriginalUri`.
      });
    }
  }, [authState?.isAuthenticated, oktaAuth]);

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <OktaConsumer onAuthStateChange={setAuthState} />
      {!authState?.isAuthenticated && (
        <LoginCallback loadingElement={<div>Loading...</div>} />
      )}
      {authState?.isAuthenticated && children}
    </Security>
  );
};

interface OktaConsumerProps {
  onAuthStateChange: (authState: AuthState | null) => void;
}

/**
 * This only exists to call `useOktaAuth()` and push `authState` to its parent.
 * @param onAuthStateChange
 */
function OktaConsumer({ onAuthStateChange }: OktaConsumerProps) {
  const { authState } = useOktaAuth();
  useEffect(() => {
    onAuthStateChange(authState);
  }, [authState, onAuthStateChange]);
  return null;
}

export const useCustomOktaProvider = () => {
  const { oktaAuth } = useOktaAuth();

  return useMemo<AuthProvider>(() => {
    return {
      // The rules for provider.
      addCredentialsToRequest: false,
      addTokenToRequest: true,
      addUsernameToRequest: false,

      getAccessToken: async () => {
        return oktaAuth.getAccessToken();
      },

      getUserInfo: async () => {
        const user = await oktaAuth.getUser();
        return { id: user.sub };
      },

      // This should technically never get called, because the user is authenticated
      // before this hook runs, but we implement it anyway.
      loginIfNeeded: async () => {
        await oktaAuth.signInWithRedirect();
      },

      logOut: async () => {
        await oktaAuth.signOut();
      },

      // If this hook runs, we are already authenticated.
      // Loading and error state are handled in `OktaProvider`.
      isAuthenticated: true,
      isLoading: false,
      error: undefined,
    };
  }, [oktaAuth]);
};