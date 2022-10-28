import { useAuth, useAuthState } from "@saleor/sdk";
import { useRouter } from "next/router";
import React from "react";

import { usePaths } from "@/lib/paths";

function LoginPage() {
  const { getExternalAuthUrl, getExternalAccessToken } = useAuth();
  const { authenticated } = useAuthState();
  const router = useRouter();
  const paths = usePaths();

  /**
   * Handles retrieving access token from external authentication provider (Keycloak).
   * After retrieving, navigates user to account preferences page.
   *
   * @param state OIDC Authorization Flow state param
   * @param code OIDC Authorization Code param
   */
  const handleGetAccessToken = async (state: string, code: string) => {
    try {
      await getExternalAccessToken({
        pluginId: "mirumee.authentication.openidconnect",
        input: JSON.stringify({
          code,
          state,
        }),
      });

      router.push(paths.account.preferences.$url());
    } catch (error) {
      console.error(
        "Error happened while requesting access token from authentication provider: ",
        error
      );
    }
  };

  /**
   * Handles retrieving external authentication URL from Saleor API
   * and redirects user to it.
   */
  const handleRedirectTologin = async () => {
    const redirectUri = window.location.href;

    try {
      const { data } = await getExternalAuthUrl({
        pluginId: "mirumee.authentication.openidconnect",
        input: JSON.stringify({ redirectUri }),
      });
      const { authorizationUrl } = JSON.parse(data?.externalAuthenticationUrl?.authenticationData);

      window.location.assign(authorizationUrl);
    } catch (error) {
      console.error(
        "Error happened while handling redirection to authentication provider: ",
        error
      );
    }
  };

  /**
   * Determines which step of login via external provided is required if any.
   */
  const handleExternalAuthentication = () => {
    if (!authenticated) {
      const params = new URLSearchParams(window.location.search);
      const state = params.get("state");
      const code = params.get("code");
      if (state && code) {
        handleGetAccessToken(state, code);
      } else {
        handleRedirectTologin();
      }
    }
  };

  React.useEffect(() => {
    handleExternalAuthentication();
  }, []);

  if (authenticated) {
    router.push(paths.account.preferences.$url());
    return null;
  }

  return <p>You&lsquo;re being redirected to external login page...</p>;
}

export default LoginPage;
