type Appearance = {
  theme: string | null;
  bgType: string | null;
  bgValue: string | null;
  buttonStyle: string | null;
  buttonColor: string | null;
  buttonTextColor: string | null;
  fontFamily: string | null;
  textColor: string | null;
  customCss: string | null;
};

const DEFAULTS: Record<keyof Omit<Appearance, "customCss">, string> = {
  theme: "default",
  bgType: "solid",
  bgValue: "#f8f9fa",
  buttonStyle: "rounded",
  buttonColor: "#111827",
  buttonTextColor: "#ffffff",
  fontFamily: "Noto Sans TC",
  textColor: "#111827",
};

function getButtonRadius(style: string): string {
  switch (style) {
    case "pill": return "9999px";
    case "square": return "0";
    case "outline": return "12px";
    case "rounded":
    default: return "12px";
  }
}

export function generateCSS(appearance: Appearance | null): string {
  const a = {
    bgType: appearance?.bgType ?? DEFAULTS.bgType,
    bgValue: appearance?.bgValue ?? DEFAULTS.bgValue,
    buttonStyle: appearance?.buttonStyle ?? DEFAULTS.buttonStyle,
    buttonColor: appearance?.buttonColor ?? DEFAULTS.buttonColor,
    buttonTextColor: appearance?.buttonTextColor ?? DEFAULTS.buttonTextColor,
    fontFamily: appearance?.fontFamily ?? DEFAULTS.fontFamily,
    textColor: appearance?.textColor ?? DEFAULTS.textColor,
  };

  const bgRule =
    a.bgType === "gradient"
      ? `background: ${a.bgValue};`
      : a.bgType === "image"
        ? `background: url(${a.bgValue}) center/cover no-repeat fixed;`
        : `background-color: ${a.bgValue};`;

  const isOutline = a.buttonStyle === "outline";
  const btnBg = isOutline ? "transparent" : a.buttonColor;
  const btnText = isOutline ? a.buttonColor : a.buttonTextColor;
  const btnBorder = isOutline ? `2px solid ${a.buttonColor}` : "none";

  return `
    :root {
      --text-color: ${a.textColor};
      --btn-bg: ${btnBg};
      --btn-text: ${btnText};
      --btn-radius: ${getButtonRadius(a.buttonStyle)};
      --btn-border: ${btnBorder};
      --font-family: '${a.fontFamily}', system-ui, sans-serif;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      ${bgRule}
      font-family: var(--font-family);
      color: var(--text-color);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .bio-container {
      max-width: 480px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
    }
    .avatar-placeholder {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: bold;
      color: var(--text-color);
    }
    .display-name {
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
    }
    .bio-text {
      font-size: 0.95rem;
      text-align: center;
      opacity: 0.7;
      max-width: 360px;
    }
    .links {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .link-btn {
      display: block;
      width: 100%;
      padding: 1rem 1.5rem;
      background: var(--btn-bg);
      color: var(--btn-text);
      border: var(--btn-border);
      border-radius: var(--btn-radius);
      text-decoration: none;
      text-align: center;
      font-weight: 500;
      font-size: 1rem;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .link-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .footer {
      margin-top: 2rem;
      font-size: 0.75rem;
      opacity: 0.4;
    }
    ${appearance?.customCss ?? ""}
  `.trim();
}
