import React, { useState } from "react";

interface SiteLogoProps {
  className?: string;
  size?: number;
  inline?: boolean;
  alt?: string;
}

/**
 * Centralized logo renderer. Falls back to text if the image is missing
 * so we never show a broken image while assets propagate.
 */
const SiteLogo: React.FC<SiteLogoProps> = ({
  className = "",
  size = 56,
  inline = false,
  alt = "VoiceToWebsite logo",
}) => {
  const [failed, setFailed] = useState(false);
  const dimension = `${size}px`;

  return (
    <div
      className={`flex items-center gap-3 ${inline ? "" : "shrink-0"} ${className}`.trim()}
      aria-label="VoiceToWebsite"
    >
      {!failed ? (
        <img
          src="/logo-voicetowebsite.svg"
          alt={alt}
          width={size}
          height={size}
          className="object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: dimension, height: dimension }}
        />
      ) : null}
      {failed && (
        <span className="font-outfit font-black text-xl tracking-tight">
          VoiceToWebsite
        </span>
      )}
    </div>
  );
};

export default SiteLogo;
