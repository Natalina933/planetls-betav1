"use client";

import { useEffect, useState } from "react";
import type { ReadabilityScale } from "./OnboardingStepHeader/OnboardingStepHeader";

export default function useReadabilityScale() {
  const [readabilityScale, setReadabilityScale] = useState<ReadabilityScale>("normal");

  useEffect(() => {
    const savedScale = window.localStorage.getItem("planetls-readability-scale");
    const legacyMode = window.localStorage.getItem("planetls-readability-mode") === "1";

    if (savedScale === "large" || savedScale === "xlarge" || savedScale === "normal") {
      setReadabilityScale(savedScale);
      return;
    }

    setReadabilityScale(legacyMode ? "large" : "normal");
  }, []);

  useEffect(() => {
    const isReadable = readabilityScale !== "normal";
    document.body.dataset.readability = isReadable ? "on" : "off";
    document.body.dataset.readabilityScale = readabilityScale;
    window.localStorage.setItem("planetls-readability-mode", isReadable ? "1" : "0");
    window.localStorage.setItem("planetls-readability-scale", readabilityScale);

    return () => {
      document.body.dataset.readability = "off";
      delete document.body.dataset.readabilityScale;
    };
  }, [readabilityScale]);

  return { readabilityScale, setReadabilityScale };
}
