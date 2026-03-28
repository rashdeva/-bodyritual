"use client";

import {
  Auth,
  Config,
  ConfigResponseMode,
  ConfigSource,
  OneTap,
  OneTapInternalEvents,
  WidgetEvents,
} from "@vkid/sdk";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";

type VkIdOneTapProps = {
  appId: string;
  redirectUrl: string;
  disabled?: boolean;
};

export function VkIdOneTap({ appId, redirectUrl, disabled = false }: VkIdOneTapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (disabled || initializedRef.current) {
      return;
    }

    if (!containerRef.current) {
      return;
    }

    initializedRef.current = true;

    console.info("[auth] initializing VKID OneTap", {
      appId,
      redirectUrl,
      location: window.location.href,
    });

    Config.init({
      app: Number(appId),
      redirectUrl,
      responseMode: ConfigResponseMode.Callback,
      source: ConfigSource.LOWCODE,
      scope: "",
    });

    const oneTap = new OneTap();
    const handleError = (vkError: unknown) => {
      console.error("[auth] VKID widget error", vkError);
      setError("VK ID не смог инициализировать вход.");
    };

    const widget = oneTap.render({
      container: containerRef.current,
      showAlternativeLogin: true,
    });

    widget
      .on(WidgetEvents.ERROR, handleError)
      .on(OneTapInternalEvents.LOGIN_SUCCESS, async (payload: unknown) => {
        console.info("[auth] VKID login success payload", payload);

        try {
          const record = payload as { code?: string; device_id?: string; deviceId?: string };
          const code = record.code;
          const deviceId = record.device_id ?? record.deviceId ?? "";

          if (!code || !deviceId) {
            throw new Error("VK ID did not return code/device_id.");
          }

          const tokenResult = await Auth.exchangeCode(code, deviceId);
          console.info("[auth] VKID exchangeCode result", tokenResult);

          const accessToken = String(
            (tokenResult as Record<string, unknown>).access_token ??
              (tokenResult as Record<string, unknown>).accessToken ??
              "",
          );

          if (!accessToken) {
            throw new Error("VK ID did not return access token.");
          }

          const userInfo = await Auth.userInfo(accessToken);
          console.info("[auth] VKID userInfo result", userInfo);

          const result = await signIn("vkid", {
            redirect: true,
            callbackUrl: "/",
            vk_payload: JSON.stringify({
              tokenResult,
              userInfo,
              code,
              deviceId,
            }),
          });

          console.info("[auth] next-auth credentials signIn result", result ?? null);
        } catch (vkError) {
          console.error("[auth] VKID sign-in flow failed", vkError);
          setError(vkError instanceof Error ? vkError.message : "VK ID login failed.");
        }
      });
  }, [appId, disabled, redirectUrl]);

  return (
    <div className="w-full">
      <div ref={containerRef} className={disabled ? "pointer-events-none opacity-50" : ""} />
      {error ? <p className="mt-4 text-sm leading-6 text-rose-700">{error}</p> : null}
    </div>
  );
}
