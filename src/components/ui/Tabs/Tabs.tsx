"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import styles from "./Tabs.module.scss";

type TabsTone = "default" | "dark";
type TabsVariant = "default" | "showcase";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type TabsProps = ComponentPropsWithoutRef<typeof RadixTabs.Root>;

export function Tabs(props: TabsProps) {
  return <RadixTabs.Root {...props} />;
}

export type TabsListProps = ComponentPropsWithoutRef<typeof RadixTabs.List> & {
  tone?: TabsTone;
  variant?: TabsVariant;
};

export const TabsList = forwardRef<ElementRef<typeof RadixTabs.List>, TabsListProps>(function TabsList(
  { className, tone = "default", variant = "default", ...props },
  ref,
) {
  return (
    <RadixTabs.List
      ref={ref}
      className={cx(styles.list, styles[tone], styles[`list${capitalize(variant)}`], className)}
      {...props}
    />
  );
});

export type TabsTriggerProps = ComponentPropsWithoutRef<typeof RadixTabs.Trigger> & {
  tone?: TabsTone;
  variant?: TabsVariant;
};

export const TabsTrigger = forwardRef<ElementRef<typeof RadixTabs.Trigger>, TabsTriggerProps>(
  function TabsTrigger({ className, tone = "default", variant = "default", ...props }, ref) {
    return (
      <RadixTabs.Trigger
        ref={ref}
        className={cx(styles.trigger, styles[tone], styles[`trigger${capitalize(variant)}`], className)}
        {...props}
      />
    );
  },
);

export type TabsContentProps = ComponentPropsWithoutRef<typeof RadixTabs.Content> & {
  variant?: TabsVariant;
};

export const TabsContent = forwardRef<ElementRef<typeof RadixTabs.Content>, TabsContentProps>(function TabsContent(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <RadixTabs.Content
      ref={ref}
      className={cx(styles.content, styles[`content${capitalize(variant)}`], className)}
      {...props}
    />
  );
});

function capitalize(value: TabsVariant) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
