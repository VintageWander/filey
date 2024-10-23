import { Tooltip as TooltipInner, useComputedColorScheme } from "@mantine/core";
import React from "react";
export const Tooltip = ({
  label,
  children,
}: {
  label: string | React.JSX.Element;
  children: React.JSX.Element;
}) => {
  const colorScheme = useComputedColorScheme();
  return (
    <TooltipInner
      maw={"95%"}
      label={label}
      color={colorScheme === "light" ? "white" : "gray"}
    >
      {children}
    </TooltipInner>
  );
};
