export const validateAudioFile = async (
  audioPath: string
): Promise<boolean> => {
  try {
    const audio = new Audio();
    audio.src = audioPath;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 2000); // Reduced timeout

      const cleanup = () => {
        clearTimeout(timeout);
        audio.removeEventListener("canplaythrough", onSuccess);
        audio.removeEventListener("error", onError);
      };

      const onSuccess = () => {
        cleanup();
        resolve(true);
      };

      const onError = () => {
        cleanup();
        resolve(false);
      };

      audio.addEventListener("canplaythrough", onSuccess, { once: true });
      audio.addEventListener("error", onError, { once: true });

      // For same-origin files, also try to load them to verify they exist
      if (audioPath.startsWith("/")) {
        fetch(audioPath, { method: "HEAD" })
          .then((response) => {
            if (!response.ok) {
              cleanup();
              resolve(false);
            }
          })
          .catch(() => {
            cleanup();
            resolve(false);
          });
      }
    });
  } catch {
    return false;
  }
};

export const getAudioFallback = (): string => {
  return "/background-music.wav"; // Fallback to original file
};
