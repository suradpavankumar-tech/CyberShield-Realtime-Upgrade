import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";


const SETTINGS_KEY =
  "cybershield_settings";


export interface AppSettings {
  autoRefresh: boolean;
  securityNotifications: boolean;
  compactInterface: boolean;
  strictPhishingBlock: boolean;
  homoglyphDefense: boolean;
  deepRedirectUnpack: boolean;
  zeroKnowledgeTelemetry: boolean;
  soundAlerts: boolean;
  threatSensitivity: "STANDARD" | "AGGRESSIVE" | "ZERO_TRUST";
  dataRetention: "30_DAYS" | "90_DAYS" | "1_YEAR" | "INDEFINITE";
  alertThreshold: "CRITICAL_ONLY" | "HIGH_AND_CRITICAL" | "ALL";
  webhookUrl: string;
  externalLookupEnabled: boolean;
}


export const defaultSettings: AppSettings = {
  autoRefresh: true,
  securityNotifications: true,
  compactInterface: false,
  strictPhishingBlock: true,
  homoglyphDefense: true,
  deepRedirectUnpack: true,
  zeroKnowledgeTelemetry: true,
  soundAlerts: false,
  threatSensitivity: "AGGRESSIVE",
  dataRetention: "90_DAYS",
  alertThreshold: "HIGH_AND_CRITICAL",
  webhookUrl: "",
  externalLookupEnabled: true,
};


interface SettingsContextValue {
  settings: AppSettings;

  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;

  saveSettings: () => void;

  resetSettings: () => void;

  clearApplicationData: () => void;

  saved: boolean;
}


const SettingsContext =
  createContext<
    SettingsContextValue | undefined
  >(undefined);


interface SettingsProviderProps {
  children: ReactNode;
}


/*
 * =========================================================
 * READ STORED SETTINGS
 * =========================================================
 */

function readStoredSettings(): AppSettings {

  try {

    const stored =
      localStorage.getItem(
        SETTINGS_KEY,
      );


    if (!stored) {
      return {
        ...defaultSettings,
      };
    }


    const parsed =
      JSON.parse(
        stored,
      ) as Partial<AppSettings>;


    return {
      ...defaultSettings,
      ...parsed,
    };

  } catch {

    /*
     * Corrupted local preferences must never
     * prevent CyberShield from starting.
     */

    try {
      localStorage.removeItem(
        SETTINGS_KEY,
      );
    } catch {
      // Ignore storage failures.
    }


    return {
      ...defaultSettings,
    };

  }

}


/*
 * =========================================================
 * APPLY GLOBAL UI PREFERENCES
 * =========================================================
 *
 * compactInterface is a real application-level preference.
 *
 * We expose it on <html> through:
 *
 *     data-cybershield-compact="true"
 *
 * This allows the application shell and CSS to react
 * globally without duplicating state in every page.
 *
 * We also expose a class:
 *
 *     cybershield-compact
 *
 * for compatibility with component-level styling.
 * =========================================================
 */

function applyCompactInterface(
  enabled: boolean,
) {

  const root =
    document.documentElement;


  if (enabled) {

    root.dataset.cybershieldCompact =
      "true";

    root.classList.add(
      "cybershield-compact",
    );

  } else {

    delete root.dataset
      .cybershieldCompact;

    root.classList.remove(
      "cybershield-compact",
    );

  }

}


/*
 * =========================================================
 * SETTINGS PROVIDER
 * =========================================================
 */

export function SettingsProvider({
  children,
}: SettingsProviderProps) {

  const [
    settings,
    setSettings,
  ] = useState<AppSettings>(
    readStoredSettings,
  );


  const [
    saved,
    setSaved,
  ] = useState(false);


  /*
   * =======================================================
   * APPLY SETTINGS ON STARTUP
   * =======================================================
   */

  useEffect(() => {

    applyCompactInterface(
      settings.compactInterface,
    );


    return () => {

      /*
       * Do not leave the application-level class
       * behind if the provider is ever unmounted.
       */

      applyCompactInterface(
        false,
      );

    };

  }, [
    settings.compactInterface,
  ]);


  /*
   * =======================================================
   * PERSIST SETTINGS
   * =======================================================
   */

  const persistSettings =
    useCallback(
      (
        nextSettings: AppSettings,
      ) => {

        try {

          localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(
              nextSettings,
            ),
          );

        } catch {

          /*
           * Local storage failure should not break
           * the running application.
           */

        }

      },
      [],
    );


  /*
   * =======================================================
   * UPDATE SINGLE SETTING
   * =======================================================
   */

  const updateSetting =
    useCallback(
      <K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K],
      ) => {

        setSettings(
          (current) => {

            const nextSettings:
              AppSettings = {
              ...current,
              [key]: value,
            };


            /*
             * Persist the exact next state.
             *
             * This avoids stale React state being
             * written to localStorage.
             */

            persistSettings(
              nextSettings,
            );


            /*
             * Compact interface is applied immediately.
             *
             * The useEffect below also keeps the DOM
             * synchronized if the state changes elsewhere.
             */

            if (
              key ===
              "compactInterface" &&
              typeof value === "boolean"
            ) {

              applyCompactInterface(
                value,
              );

            }


            return nextSettings;

          },
        );


        setSaved(true);

      },
      [
        persistSettings,
      ],
    );


  /*
   * =======================================================
   * SAVE SETTINGS
   * =======================================================
   */

  const saveSettings =
    useCallback(() => {

      persistSettings(
        settings,
      );


      applyCompactInterface(
        settings.compactInterface,
      );


      setSaved(true);

    }, [
      persistSettings,
      settings,
    ]);


  /*
   * =======================================================
   * SAVED INDICATOR
   * =======================================================
   */

  useEffect(() => {

    if (!saved) {
      return;
    }


    const timer =
      window.setTimeout(
        () => {

          setSaved(false);

        },
        2500,
      );


    return () => {

      window.clearTimeout(
        timer,
      );

    };

  }, [
    saved,
  ]);


  /*
   * =======================================================
   * RESET SETTINGS
   * =======================================================
   */

  const resetSettings =
    useCallback(() => {

      const confirmed =
        window.confirm(
          "Reset all CyberShield application preferences?",
        );


      if (!confirmed) {
        return;
      }


      try {

        localStorage.removeItem(
          SETTINGS_KEY,
        );

      } catch {
        // Ignore local storage failures.
      }


      const nextSettings:
        AppSettings = {
        ...defaultSettings,
      };


      setSettings(
        nextSettings,
      );


      applyCompactInterface(
        nextSettings.compactInterface,
      );


      setSaved(true);

    }, []);


  /*
   * =======================================================
   * CLEAR APPLICATION DATA
   * =======================================================
   *
   * IMPORTANT:
   *
   * This only clears locally stored CyberShield
   * preferences.
   *
   * It does NOT delete:
   *
   * - backend investigations
   * - scans
   * - threat results
   * - database records
   * - JWT authentication
   * - user account
   * =======================================================
   */

  const clearApplicationData =
    useCallback(() => {

      const confirmed =
        window.confirm(
          "Clear locally stored CyberShield preferences? This will not delete investigations or backend data.",
        );


      if (!confirmed) {
        return;
      }


      try {

        localStorage.removeItem(
          SETTINGS_KEY,
        );

      } catch {
        // Ignore local storage failures.
      }


      const nextSettings:
        AppSettings = {
        ...defaultSettings,
      };


      setSettings(
        nextSettings,
      );


      applyCompactInterface(
        nextSettings.compactInterface,
      );


      setSaved(true);

    }, []);


  /*
   * =======================================================
   * CONTEXT VALUE
   * =======================================================
   */

  const value =
    useMemo<SettingsContextValue>(
      () => ({
        settings,

        updateSetting,

        saveSettings,

        resetSettings,

        clearApplicationData,

        saved,
      }),
      [
        settings,
        updateSetting,
        saveSettings,
        resetSettings,
        clearApplicationData,
        saved,
      ],
    );


  return (
    <SettingsContext.Provider
      value={value}
    >
      {children}
    </SettingsContext.Provider>
  );

}


/*
 * =========================================================
 * SETTINGS HOOK
 * =========================================================
 */

export function useSettings() {

  const context =
    useContext(
      SettingsContext,
    );


  if (!context) {

    throw new Error(
      "useSettings must be used inside SettingsProvider",
    );

  }


  return context;

}