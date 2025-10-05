// Simple notification sound utility
export const playNotificationSound = () => {
  try {
    // Create audio context for better browser support
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Create a simple beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequency for a pleasant notification sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    // Set volume
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    // Fallback: try to play a system beep
    console.warn('Could not play notification sound:', error);

    // Alternative: create a data URL with a simple sound
    try {
      const audio = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeSTSWy+Kj6/y5NzMCREGhEACwIDdEQJhZ'
      );
      audio.volume = 0.3;
      audio.play();
    } catch (fallbackError) {
      console.warn('Fallback notification sound also failed:', fallbackError);
    }
  }
};
