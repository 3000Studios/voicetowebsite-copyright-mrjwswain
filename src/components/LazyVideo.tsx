import React, { useRef, useEffect, useState } from "react";

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

const LazyVideo: React.FC<LazyVideoProps> = ({ src, ...props }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return <video ref={videoRef} src={isVisible ? src : undefined} {...props} />;
};

// Optimized: Memoized to prevent re-renders when parent state (like prompt input) changes.
export default React.memo(LazyVideo);
