import React from "react";

// Map size props to Tailwind classes
const sizeMap = {
  s: {
    padding: "p-2",
    paddingX: "px-2",
    paddingY: "py-2",
    rounded: "rounded-md",
    text: "text-sm",
  },
  m: {
    padding: "p-4",
    paddingX: "px-4",
    paddingY: "py-4",
    rounded: "rounded-lg",
    text: "text-base",
  },
  lg: {
    padding: "p-6",
    paddingX: "px-6",
    paddingY: "py-6",
    rounded: "rounded-xl",
    text: "text-lg",
  },
  xl: {
    padding: "p-8",
    paddingX: "px-8",
    paddingY: "py-8",
    rounded: "rounded-2xl",
    text: "text-xl",
  },
  "2xl": {
    padding: "p-12",
    paddingX: "px-12",
    paddingY: "py-12",
    rounded: "rounded-wa",
    text: "text-2xl",
  },
};

function Div({
  children,
  className = "",
  size = "m", // s, m, lg, xl, 2xl
  padding,
  paddingX,
  paddingY,
  rounded,
  border = "border border-black",
  bg = "bg-white",
  ...rest
}) {
  // Use sizeMap defaults unless overridden by explicit props
  const sizeProps = sizeMap[size] || sizeMap["m"];
  const _padding = padding !== undefined ? padding : sizeProps.padding;
  const _paddingX = paddingX !== undefined ? paddingX : "";
  const _paddingY = paddingY !== undefined ? paddingY : "";
  const _rounded = rounded !== undefined ? rounded : sizeProps.rounded;

  // Only add paddingX/paddingY if explicitly set, otherwise rely on padding
  const classes = [
    bg,
    _rounded,
    _padding,
    _paddingX,
    _paddingY,
    border,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export default Div;
