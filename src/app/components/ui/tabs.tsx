"use client";

import * as React from "react";
import styles from "./tabs.module.scss";

type TabItem = {
  value: string;
  label: string;
  content: React.ReactNode;
};

interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ items, defaultValue, onValueChange }: TabsProps) {
  const [active, setActive] = React.useState(defaultValue ?? items[0]?.value);
  const activeTab = items.find((t) => t.value === active);
  const tabsId = React.useId();

  const handleChange = (value: string) => {
    setActive(value);
    onValueChange?.(value);
  };

  return (
    <section className={styles.tabs}>
      <div className={styles.tabsHeader} role="tablist" aria-label="Navigation des onglets">
        {items.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleChange(tab.value)}
            className={`${styles.tabButton} ${active === tab.value ? styles.active : ""}`}
            role="tab"
            aria-selected={active === tab.value}
            aria-controls={`${tabsId}-panel-${tab.value}`}
            id={`${tabsId}-tab-${tab.value}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className={styles.tabsContent}
        role="tabpanel"
        id={`${tabsId}-panel-${activeTab?.value ?? "default"}`}
        aria-labelledby={`${tabsId}-tab-${activeTab?.value ?? "default"}`}
      >
        {activeTab?.content}
      </div>
    </section>
  );
}
