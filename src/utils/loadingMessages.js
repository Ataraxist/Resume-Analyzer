// Whimsical loading messages for various processing states
export const parsingMessages = [
  'Reticulating splines...',
  'Calibrating quantum flux capacitors...',
  'Harmonizing temporal matrices...',
  'Initializing synergy protocols...',
  'Defragmenting neural pathways...',
  'Optimizing blockchain parameters...',
  'Synthesizing digital essence...',
  'Triangulating career vectors...',
  'Compiling professional aura...',
  'Reversing polarity of skill nodes...',
  'Energizing talent crystals...',
  'Aligning chakra databases...',
  'Parsing excellence wavelengths...',
  'Quantizing achievement particles...',
  'Virtualizing competency cores...',
  'Bootstrapping wisdom engines...',
  'Normalizing experience gradients...',
  'Tokenizing professional karma...',
  'Computing destiny algorithms...',
  'Activating neural handshake...',
  'Establishing quantum entanglement...',
  'Downloading more RAM...',
  'Consulting the ancient scrolls...',
  'Appeasing the algorithm gods...',
  'Charging talent capacitors...'
];

export const analysisMessages = [
  'Consulting the career oracle...',
  'Measuring professional synergies...',
  'Calculating expertise coefficients...',
  'Analyzing skill quantum entanglement...',
  'Decoding occupational DNA...',
  'Calibrating job-fit sensors...',
  'Computing compatibility matrices...',
  'Scanning dimension frequencies...',
  'Harmonizing career wavelengths...',
  'Evaluating professional resonance...',
  'Mapping competency constellations...',
  'Synchronizing talent algorithms...',
  'Analyzing career trajectory vectors...',
  'Processing qualification quanta...',
  'Measuring skill-gap dimensions...',
  'Calculating opportunity coefficients...',
  'Optimizing career path algorithms...',
  'Detecting hidden talent patterns...',
  'Amplifying professional signals...',
  'Resolving career paradoxes...',
  'Interpolating success probabilities...',
  'Quantifying expertise levels...',
  'Balancing skill equations...',
  'Unlocking achievement potentials...',
  'Converging on optimal fit scores...'
];

// Combine both for mixed use cases
export const allMessages = [...parsingMessages, ...analysisMessages];

// Helper to get a random message
export const getRandomMessage = (messages = allMessages) => {
  return messages[Math.floor(Math.random() * messages.length)];
};

// Helper to cycle through messages
export class MessageCycler {
  constructor(messages = allMessages, interval = 2500) {
    this.messages = messages;
    this.interval = interval;
    this.currentIndex = Math.floor(Math.random() * messages.length);
    this.timer = null;
    this.listeners = new Set();
  }

  start() {
    if (this.timer) return;
    
    this.timer = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.messages.length;
      this.notify();
    }, this.interval);
    
    // Notify immediately with current message
    this.notify();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getCurrentMessage() {
    return this.messages[this.currentIndex];
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const message = this.getCurrentMessage();
    this.listeners.forEach(callback => callback(message));
  }
}