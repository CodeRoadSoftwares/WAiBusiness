import React from "react";
import { CgSpinnerTwo } from "react-icons/cg";

function Spinner({
  size = 40, // px, default to 40px
  theme = "brand",
  fullscreen = false,
  container = false, // New prop for container-relative overlay
  animation = "default", // 'default' | 'pulse'
  className = "",
  style = {},
  text,
  ...rest
}) {
  // Theme color mapping
  const themeColor =
    {
      brand: "text-wa-brand",
      light: "text-wa-text-primary-light",
      dark: "text-wa-text-primary-dark",
    }[theme] || theme;

  const animationClass =
    animation === "pulse" ? "animate-spin-pulse" : "animate-spin";

  // Radial gradient overlay styles
  const getGradientStyle = () => {
    if (theme === "dark") {
      return {
        background:
          "radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.1) 70%, transparent 100%)",
      };
    }
    return {
      background:
        "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.1) 70%, transparent 100%)",
    };
  };

  // Inline style for size
  const iconStyle = {
    width: size,
    height: size,
    ...style,
  };

  // Fullscreen overlay
  if (fullscreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${className}`}
        style={{ ...getGradientStyle(), ...style }}
        {...rest}
      >
        <CgSpinnerTwo
          className={`${animationClass} ${themeColor}`}
          style={iconStyle}
        />
        {text && (
          <div className="mt-6 text-lg text-gray-700 dark:text-gray-200 text-center px-4">
            {text}...
          </div>
        )}
      </div>
    );
  }

  // Container overlay - covers only the parent container
  if (container) {
    return (
      <div
        className={`absolute inset-0 z-40 flex flex-col items-center justify-center ${className}`}
        style={{ ...getGradientStyle(), ...style }}
        {...rest}
      >
        <CgSpinnerTwo
          className={`${animationClass} ${themeColor}`}
          style={iconStyle}
        />
        {text && (
          <div className="mt-6 text-lg text-gray-700 dark:text-gray-200 text-center px-4">
            {text}...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`} {...rest}>
      <CgSpinnerTwo
        className={`${animationClass} ${themeColor}`}
        style={iconStyle}
      />
    </div>
  );
}

export default Spinner;
