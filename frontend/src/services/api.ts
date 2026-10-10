import axios, {
  AxiosHeaders,
} from "axios";


const TOKEN_KEY =
  "cybershield_token";

const USER_KEY =
  "cybershield_user";


/*
 * ==================================================
 * API BASE URL
 * ==================================================
 *
 * Vite exposes VITE_API_BASE_URL at build time.
 *
 * Examples:
 *
 *   http://127.0.0.1:8000/api/v1
 *   https://api.example.com/api/v1
 *   /api/v1
 *
 * A relative path is intentionally supported so the
 * frontend can also be deployed behind the same origin
 * as the API.
 * ==================================================
 */

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || "/api/v1";


function normalizeBaseUrl(
  value: string | undefined,
): string {

  if (!value) {
    return "/api/v1";
  }


  /*
   * Relative URLs are valid for same-origin deployments.
   */

  if (value.startsWith("/")) {

    /*
     * Remove trailing slashes so endpoint calls such as
     * "/auth/login" do not create accidental "//".
     */

    return value.replace(
      /\/+$/,
      "",
    );

  }


  /*
   * Absolute URLs must use HTTP or HTTPS.
   *
   * This prevents accidental unsupported protocols
   * from being accepted as an API endpoint.
   */

  let parsed: URL;

  try {

    parsed = new URL(
      value,
    );

  } catch {

    throw new Error(
      "CyberShield API configuration is invalid. VITE_API_BASE_URL must be a valid HTTP(S) URL or a relative /api path.",
    );

  }


  if (
    parsed.protocol !==
      "http:" &&
    parsed.protocol !==
      "https:"
  ) {

    throw new Error(
      "CyberShield API configuration is invalid. Only HTTP and HTTPS API URLs are supported.",
    );

  }


  /*
   * Preserve the origin + path but remove trailing
   * slashes from the path.
   */

  parsed.pathname =
    parsed.pathname.replace(
      /\/+$/,
      "",
    );


  /*
   * The API base URL should not carry query parameters
   * or fragments.
   */

  parsed.search = "";
  parsed.hash = "";


  return parsed.toString()
    .replace(
      /\/+$/,
      "",
    );

}


const API_BASE_URL =
  normalizeBaseUrl(
    configuredBaseUrl,
  );


/*
 * ==================================================
 * API CLIENT
 * ==================================================
 */

const api = axios.create({

  baseURL:
    API_BASE_URL,

  headers: {
    "Content-Type":
      "application/json",
  },

  timeout: 30_000,

});


/*
 * ==================================================
 * AUTH FAILURE CONTROL
 * ==================================================
 *
 * Multiple API requests can fail with 401 at the
 * same time during token expiration.
 *
 * Only the first failure should redirect the user.
 * ==================================================
 */

let redirectingToLogin =
  false;


/*
 * ==================================================
 * REQUEST INTERCEPTOR
 * ==================================================
 *
 * Attach the current JWT to every protected request.
 * ==================================================
 */

api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem(
        TOKEN_KEY,
      );


    if (token) {

      /*
       * Axios v1 uses AxiosHeaders internally.
       */

      if (!config.headers) {

        config.headers =
          new AxiosHeaders();

      }


      config.headers.set(
        "Authorization",
        `Bearer ${token}`,
      );

    }


    return config;

  },

  (error) =>
    Promise.reject(error),

);


/*
 * ==================================================
 * RESPONSE INTERCEPTOR
 * ==================================================
 *
 * Centralized handling for:
 *
 * 401 → authentication failure
 * 403 → authenticated but forbidden
 * timeout → backend took too long
 * network failure → backend unreachable
 *
 * The original Axios error is always propagated.
 * ==================================================
 */

api.interceptors.response.use(

  (response) =>
    response,

  async (error) => {

    const status =
      error?.response?.status;


    /*
     * ------------------------------------------------
     * AUTHENTICATION FAILURE
     * ------------------------------------------------
     */

    if (status === 401) {

      localStorage.removeItem(
        TOKEN_KEY,
      );

      localStorage.removeItem(
        USER_KEY,
      );


      /*
       * Prevent multiple simultaneous API failures
       * from causing repeated redirects.
       */

      if (
        !redirectingToLogin &&
        window.location.pathname !==
          "/login"
      ) {

        redirectingToLogin =
          true;


        /*
         * replace() prevents the browser Back button
         * from returning to an authenticated route.
         */

        window.location.replace(
          "/login",
        );

      }

    }


    /*
     * ------------------------------------------------
     * FORBIDDEN
     * ------------------------------------------------
     *
     * A 403 does NOT mean the JWT is invalid.
     *
     * Keep the session alive and let the calling page
     * decide how to display the permission failure.
     */

    if (status === 403) {

      /*
       * Intentionally no logout.
       */

    }


    /*
     * ------------------------------------------------
     * REQUEST TIMEOUT
     * ------------------------------------------------
     */

    if (
      error?.code ===
        "ECONNABORTED" ||
      error?.code ===
        "ETIMEDOUT"
    ) {

      error.userMessage =
        "The security service took too long to respond.";

    }


    /*
     * ------------------------------------------------
     * NETWORK FAILURE
     * ------------------------------------------------
     *
     * No HTTP response means the request did not
     * successfully reach a responding backend.
     */

    if (
      !error?.response &&
      error?.request
    ) {

      error.userMessage =
        "Unable to reach the CyberShield backend.";

    }


    /*
     * ------------------------------------------------
     * ALWAYS PROPAGATE ORIGINAL ERROR
     * ------------------------------------------------
     */

    return Promise.reject(
      error,
    );

  },

);


export default api;