export type GameCue = 'start' | 'select' | 'correct' | 'incorrect' | 'warning' | 'victory' | 'complete';
type Voice = { at: number; hz: number; duration: number; volume: number; wave: OscillatorType; slide?: number };
const note = (at: number, hz: number, duration = .17, volume = .12, wave: OscillatorType = 'triangle', slide?: number): Voice => ({ at, hz, duration, volume, wave, slide });
export function gameCueVoices(cue: GameCue): Voice[] {
  switch (cue) {
    case 'select': return [note(0, 880, .065, .065, 'sine')];
    case 'warning': return [note(0, 1046.5, .095, .095, 'sine'), note(.12, 1046.5, .07, .065, 'sine')];
    case 'correct': return [note(0, 130.81, .18, .14, 'sine', 65.4), ...[523.25, 659.25, 783.99, 1046.5].map((hz, i) => note(.025 + i * .11, hz, i === 3 ? .3 : .15, .12)), note(.35, 523.25, .3, .065, 'sine')];
    case 'incorrect': return [note(0, 392, .22, .11, 'triangle', 293.66), note(.21, 261.63, .32, .105, 'triangle', 196), note(0, 130.81, .24, .08, 'sine')];
    case 'start': return [note(0, 130.81, .2, .13, 'sine', 65.4), ...[261.63, 329.63, 392, 523.25, 783.99].map((hz, i) => note(.08 + i * .105, hz, .2, .1)), note(.5, 261.63, .35, .085)];
    case 'victory': return [...[0, .22, .44].flatMap(at => [note(at, 130.81, .15, .13, 'sine', 65.4), note(at, 523.25, .13, .1)]), ...[659.25, 783.99, 1046.5, 1318.51].map((hz, i) => note(.65 + i * .13, hz, .25, .11)), ...[261.63, 329.63, 392, 523.25].map(hz => note(1.15, hz, .7, .055))];
    case 'complete': return [...[392, 523.25, 659.25, 783.99].map((hz, i) => note(i * .16, hz, .3, .1)), ...[261.63, 329.63, 392].map(hz => note(.65, hz, .55, .055))];
  }
}
export function scheduleGameCue(audio: BaseAudioContext, cue: GameCue, delay = 0, track?: (node: OscillatorNode) => void) {
  for (const voice of gameCueVoices(cue)) {
    const oscillator = audio.createOscillator(), envelope = audio.createGain();
    const at = audio.currentTime + .015 + delay + voice.at;
    oscillator.type = voice.wave; oscillator.frequency.setValueAtTime(voice.hz, at);
    if (voice.slide) oscillator.frequency.exponentialRampToValueAtTime(voice.slide, at + voice.duration);
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.exponentialRampToValueAtTime(voice.volume, at + .009);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + voice.duration);
    oscillator.connect(envelope); envelope.connect(audio.destination);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    track?.(oscillator); oscillator.start(at); oscillator.stop(at + voice.duration + .025);
  }
}
