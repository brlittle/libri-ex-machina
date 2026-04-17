"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

interface Props {
  onDetected: (code: string) => void;
  onClose: () => void;
}

type Phase = "permission" | "pick" | "scanning" | "error";

const EXTERNAL_HINTS = ["c922", "c920", "c930", "c615", "usb", "external", "logitech", "webcam"];

function preferredDevice(devices: MediaDeviceInfo[]): string {
  const label = (d: MediaDeviceInfo) => d.label.toLowerCase();
  const external = devices.find((d) =>
    EXTERNAL_HINTS.some((h) => label(d).includes(h))
  );
  return (external ?? devices[0]).deviceId;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const detectedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>("permission");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: get permission, enumerate devices, auto-pick or show picker
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Request permission — browser shows the camera-access prompt here
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop immediately; we only needed the permission grant
        stream.getTracks().forEach((t) => t.stop());

        if (cancelled) return;

        const all = await navigator.mediaDevices.enumerateDevices();
        const cams = all.filter((d) => d.kind === "videoinput");

        if (cams.length === 0) {
          setErrorMsg("No camera found on this device.");
          setPhase("error");
          return;
        }

        setDevices(cams);
        const best = preferredDevice(cams);
        setSelectedId(best);

        // Only show picker if there are multiple cameras
        if (cams.length > 1) {
          setPhase("pick");
        } else {
          startScanning(best);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const err = e as Error;
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setErrorMsg("Camera access denied. Check browser permissions and try again.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setErrorMsg("No camera found on this device.");
        } else {
          setErrorMsg(err.message || "Could not access the camera.");
        }
        setPhase("error");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      readerRef.current?.reset();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startScanning = useCallback(
    (deviceId: string) => {
      if (!videoRef.current) return;

      readerRef.current?.reset();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      detectedRef.current = false;

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      setPhase("scanning");

      // 10-second timeout guard
      timeoutRef.current = setTimeout(() => {
        reader.reset();
        setErrorMsg(
          "Camera took too long to start. Try selecting a different camera or refreshing."
        );
        setPhase("error");
      }, 10_000);

      reader
        .decodeFromConstraints(
          { video: { deviceId: { exact: deviceId } } },
          videoRef.current,
          (result, err) => {
            if (detectedRef.current) return;
            if (result) {
              detectedRef.current = true;
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              reader.reset();
              onDetected(result.getText());
            } else if (err && !(err instanceof NotFoundException)) {
              console.warn("[BarcodeScanner]", err);
            }
          }
        )
        .then(() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          // stream is live — phase is already "scanning"
        })
        .catch((e: Error) => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
            setErrorMsg("Camera access denied. Check browser permissions and try again.");
          } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
            setErrorMsg("No camera found on this device.");
          } else {
            setErrorMsg(e.message || "Could not start the camera.");
          }
          setPhase("error");
        });
    },
    [onDetected]
  );

  function handleDeviceChange(deviceId: string) {
    setSelectedId(deviceId);
    startScanning(deviceId);
  }

  function handleStartWithPicked() {
    startScanning(selectedId);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700">
          <div>
            <h2 className="text-base font-semibold text-stone-100">Scan Barcode</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Point the camera at a UPC, EAN, or ISBN barcode
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Camera picker (shown before scanning when multiple cameras detected) */}
        {phase === "pick" && (
          <div className="px-5 py-8 flex flex-col items-center gap-4">
            <span className="text-3xl">📷</span>
            <p className="text-sm text-stone-300 text-center">
              Multiple cameras detected. Choose which one to use:
            </p>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-300 focus:outline-none focus:border-amber-500"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            <button
              onClick={handleStartWithPicked}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold rounded-lg text-sm"
            >
              Start Scanning
            </button>
          </div>
        )}

        {/* Viewfinder — always rendered so videoRef is never null */}
        <div
          className="relative bg-black"
          style={{ aspectRatio: "4/3", display: phase === "pick" || phase === "error" ? "none" : undefined }}
        >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {phase === "permission" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
                <div className="w-8 h-8 border-2 border-stone-600 border-t-amber-400 rounded-full animate-spin mb-3" />
                <p className="text-sm">Requesting camera access…</p>
              </div>
            )}

            {phase === "scanning" && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-56 h-36">
                    <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl" />
                    <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr" />
                    <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl" />
                    <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br" />
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-400/70 animate-scan" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <span className="bg-black/60 text-amber-300 text-xs px-3 py-1 rounded-full">
                    Scanning…
                  </span>
                </div>
              </>
            )}
          </div>

        {/* Error state */}
        {phase === "error" && (
          <div className="px-6 py-10 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">📷</span>
            <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
            <button
              onClick={() => selectedId ? startScanning(selectedId) : setPhase("permission")}
              className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg text-xs text-stone-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Footer */}
        {phase === "scanning" && (
          <div className="px-5 py-3 border-t border-stone-700 flex items-center gap-2">
            {devices.length > 1 && (
              <>
                <label className="text-xs text-stone-400 flex-shrink-0">Camera:</label>
                <select
                  value={selectedId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-2 py-1 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </>
            )}
            {devices.length <= 1 && (
              <p className="text-xs text-stone-600 text-center w-full">
                Hold the barcode steady inside the frame — detection is automatic.
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0%   { top: 0; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan { animation: scan 2s linear infinite; }
      `}</style>
    </div>
  );
}
