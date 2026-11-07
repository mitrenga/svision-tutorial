const { AbstractAudioManager } = await import('./svision/js/audio/abstractAudioManager.js?ver='+window.srcVersion);
const { AudioSampleHandler } = await import('./svision/js/audio/audioSampleHandler.js?ver='+window.srcVersion);
const { PCMSample } = await import('./svision/js/audio/pcmSample.js?ver='+window.srcVersion);
// begin code

/**
 * One bus of digitised sound. The samples are synthesised here because the
 * demo has no game data; a game decodes its own out of its data files and
 * hands them over the same way — a {@link PCMSample} per sound name.
 */
export class AudioManager extends AbstractAudioManager {

  constructor(app) {
    super(app);
    this.id = 'AudioManager';
  } // constructor

  createAudioHandler(bus, options) {
    return new AudioSampleHandler(this.app);
  } // createAudioHandler

  /**
   * The sample of a sound, made on the first request and cached by the bus.
   * Sound Blaster rates of the era: 11025 Hz for the game sounds.
   */
  audioData(bus, sound, options) {
    var cached = super.audioData(bus, sound, options);
    if (cached !== false) {
      return cached;
    }
    var sample = false;
    switch (sound) {
      case 'blip':
        sample = PCMSample.tone(11025, 880, 0.25, {wave: 'square', volume: 0.5, decay: 0.12});
        break;
      case 'chord':
        sample = PCMSample.tone(11025, 220, 1.2, {wave: 'saw', volume: 0.6, decay: 0.8});
        break;
      case 'noise':
        // an 8-bit "DAC" recording: unsigned bytes, the way the games store them
        var bytes = new Uint8Array(11025/4);
        var seed = 0xC0DE;
        for (var i = 0; i < bytes.length; i++) {
          seed = (seed*1103515245+12345) & 0x7FFFFFFF;    // LCG, seeded: repeatable
          var envelope = 1-i/bytes.length;
          bytes[i] = 128+Math.round(((seed >> 16) & 0xFF)-128)*envelope*0.6;
        }
        sample = PCMSample.fromUnsigned8(bytes, 11025);
        break;
    }
    if (sample !== false) {
      this.audioDataCache[bus][sound] = sample;
    }
    return sample;
  } // audioData

} // AudioManager
