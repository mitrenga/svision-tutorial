const { AbstractAudioManager } = await import('./svision/js/audio/abstractAudioManager.js?ver='+window.srcVersion);
const { AudioWorkletHandler } = await import('./svision/js/audio/audioWorkletHandler.js?ver='+window.srcVersion);
const { AudioScriptProcessorHandler } = await import('./svision/js/audio/audioScriptProcessorHandler.js?ver='+window.srcVersion);
const { AudioSilentHandler } = await import('./svision/js/audio/audioSilentHandler.js?ver='+window.srcVersion);
const { Tool } = await import('./svision/js/tool.js?ver='+window.srcVersion);
const { ZXMachineSounds } = await import('./svision/js/platform/canvas2D/zx/zxMachineSounds.js?ver='+window.srcVersion);
// begin code

/**
 * One bus, `sounds`, of one-bit beeper pulses — the shape every ZX remake
 * uses. The handler is the worklet, or the script processor where the
 * worklet is unsupported, or silence (which still fires the timed events of a
 * sound, so a tape block loads its bytes with the volume at 0 too).
 *
 * Every sound here comes from {@link ZXMachineSounds}: the demo has no game
 * and therefore no sounds of its own.
 */
export class AudioManager extends AbstractAudioManager {

  constructor(app) {
    super(app);
    this.id = 'AudioManager';
    this.volume = {};
    this.volume.sounds = Math.min(10, Math.max(0, Math.round(Number(Tool.readCookie('audioBusSoundsLevel', 5)))));
  } // constructor

  createAudioHandler(bus, options) {
    if (options.audioSilentHandler != 'disable' && this.volumeLevel(this.volume.sounds) == 0.0) {
      return new AudioSilentHandler(this.app);
    }
    if (this.unsupportedAudioBus === false) {
      this.unsupportedAudioBus = Tool.readCookie('unsupportedAudioBus', false);
    }
    switch (this.unsupportedAudioBus) {
      case 'AudioWorkletHandler':
        Tool.writeCookie('unsupportedAudioBus', 'AudioWorkletHandler');
        return new AudioScriptProcessorHandler(this.app);
      case 'AudioScriptProcessorHandler':
        Tool.writeCookie('unsupportedAudioBus', 'AudioScriptProcessorHandler');
        return new AudioSilentHandler(this.app);
    }
    return new AudioWorkletHandler(this.app);
  } // createAudioHandler

  /**
   * The pulse data of a sound.
   * @param {string} bus - The bus.
   * @param {string} sound - 'tapePilotTone', 'tapeRndData', 'basicBeeps',
   *        'keyClick', or 'tapeBlock' with `options.bytes` — the block whose
   *        bytes arrive as 'tapeByte' events and whose end as 'tapeEnd'.
   * @param {Object} options - Playback options.
   * @returns {Object|boolean} The data, or false for an unknown sound.
   */
  audioData(bus, sound, options) {
    var cached = super.audioData(bus, sound, options);
    if (cached !== false) {
      return cached;
    }
    var sampleRate = this.getSampleRate();
    var volume = this.volumeLevel(this.volume.sounds);
    switch (sound) {
      case 'tapePilotTone': return ZXMachineSounds.tapePilotTone(sampleRate, volume);
      case 'tapeRndData': return ZXMachineSounds.tapeRndData(sampleRate, volume);
      case 'basicBeeps': return ZXMachineSounds.basicBeeps(sampleRate, volume);
      case 'keyClick': return ZXMachineSounds.keyClick(sampleRate, volume);
      case 'tapeBlock':
        return ZXMachineSounds.tapeData(sampleRate, volume, options.bytes, {byteEvent: 'tapeByte', endEvent: 'tapeEnd'});
    }
    return false;
  } // audioData

  /**
   * The gain of a volume step 0-10, the curve the ZX remakes share.
   * @param {number} volume - 0 to 10.
   * @returns {number} The gain.
   */
  volumeLevel(volume) {
    var levels = [0, 0.005, 0.01, 0.02, 0.04, 0.07, 0.1, 0.14, 0.18, 0.23, 0.29];
    return levels[volume];
  } // volumeLevel

} // AudioManager
