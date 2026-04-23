import { Howl } from 'howler';

const sounds = {
  click: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], volume: 0.2 }),
  wave: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1105/1105-preview.mp3'], volume: 0.1 }),
  success: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'], volume: 0.3 }),
  zap: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'], volume: 0.4 }),
  tick: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], volume: 0.1 }),
};

export const useSound = () => {
  const playClick = () => sounds.click.play();
  const playWave = () => sounds.wave.play();
  const playSuccess = () => sounds.success.play();
  const playZap = () => sounds.zap.play();
  const playTick = () => sounds.tick.play();

  return { playClick, playWave, playSuccess, playZap, playTick };
};
