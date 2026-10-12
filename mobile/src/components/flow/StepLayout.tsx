import React from "react";
import { ScrollView, View } from "react-native";
import { StepHeader } from "../ui";

/** Scrollable step body with a pinned footer (the primary action). */
export function StepLayout({
  title, subtitle, children, footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepHeader title={title} subtitle={subtitle} />
        {children}
      </ScrollView>
      {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, gap: 8 }}>{footer}</View> : null}
    </View>
  );
}
