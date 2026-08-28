import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "assets", "sounds");
const TMP = join(ROOT, ".sound-forge");

const RATE = 44100;

function make(seconds) {
  return new Float32Array(Math.max(1, Math.round(seconds * RATE)));
}

let seed = 0x9e3779b9;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function noiseSample() {
  return random() * 2 - 1;
}

function at(value, t) {
  return typeof value === "function" ? value(t) : value;
}

function glide(from, to, seconds) {
  return (t) => {
    const k = Math.min(1, Math.max(0, t / seconds));
    return from * Math.pow(to / from, k);
  };
}

function perc(attack, decay) {
  return (t) => (1 - Math.exp(-t / Math.max(attack, 1e-5))) * Math.exp(-t / decay);
}

function swell(attack, hold, release) {
  return (t) => {
    if (t < attack) return 1 - Math.exp((-t / attack) * 3);
    if (t < attack + hold) return 1;
    return Math.exp((-(t - attack - hold) / release) * 3);
  };
}

const WAVES = {
  sine: (p) => Math.sin(p),
  saw: (p) => 2 * (((p / (2 * Math.PI)) % 1) + 1) - 3,
  square: (p) => (Math.sin(p) >= 0 ? 1 : -1),
  triangle: (p) => (2 / Math.PI) * Math.asin(Math.sin(p)),
};

function osc(seconds, { wave = "sine", freq, gain = 1, phase = 0 }) {
  const out = make(seconds);
  const shape = WAVES[wave];
  let angle = phase;

  for (let i = 0; i < out.length; i += 1) {
    const t = i / RATE;
    angle += (2 * Math.PI * at(freq, t)) / RATE;
    out[i] = shape(angle) * at(gain, t);
  }

  return out;
}

function noise(seconds, { gain = 1 } = {}) {
  const out = make(seconds);
  for (let i = 0; i < out.length; i += 1) out[i] = noiseSample() * at(gain, i / RATE);
  return out;
}

function filter(input, { cutoff, q = 1, mode = "lp" }) {
  const out = new Float32Array(input.length);
  const damp = 1 / Math.max(q, 0.3);
  let low = 0;
  let band = 0;

  for (let i = 0; i < input.length; i += 1) {
    const hz = Math.min(Math.max(at(cutoff, i / RATE), 20), RATE * 0.33);
    const f = 2 * Math.sin((Math.PI * hz) / RATE);
    const high = input[i] - low - damp * band;
    band += f * high;
    low += f * band;
    out[i] = mode === "lp" ? low : mode === "bp" ? band : high;
  }

  return out;
}

function shape(input, envelope) {
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i += 1) out[i] = input[i] * at(envelope, i / RATE);
  return out;
}

function drive(input, amount) {
  const out = new Float32Array(input.length);
  const norm = Math.tanh(amount);
  for (let i = 0; i < input.length; i += 1) out[i] = Math.tanh(input[i] * amount) / norm;
  return out;
}

function room(input, { time = 0.055, feedback = 0.34, mix = 0.25, taps = 4 } = {}) {
  const out = Float32Array.from(input);

  for (let tap = 1; tap <= taps; tap += 1) {
    const offset = Math.round(time * tap * RATE);
    const gain = mix * Math.pow(feedback, tap - 1);
    for (let i = offset; i < out.length; i += 1) out[i] += input[i - offset] * gain;
  }

  return out;
}

function mix(into, layer, { at: offset = 0, gain = 1 } = {}) {
  const start = Math.round(offset * RATE);
  for (let i = 0; i < layer.length; i += 1) {
    const target = start + i;
    if (target >= 0 && target < into.length) into[target] += layer[i] * gain;
  }
  return into;
}

function trim(input, floor = 0.0006) {
  let last = input.length - 1;
  while (last > 0 && Math.abs(input[last]) < floor) last -= 1;
  return input.subarray(0, Math.min(input.length, last + Math.round(0.01 * RATE)));
}

function finish(input, peak) {
  const body = trim(input);
  const out = Float32Array.from(body);

  let loudest = 0;
  for (const sample of out) loudest = Math.max(loudest, Math.abs(sample));
  const scale = loudest > 0 ? peak / loudest : 0;

  const edge = Math.round(0.004 * RATE);
  for (let i = 0; i < out.length; i += 1) {
    const fadeIn = Math.min(1, i / edge);
    const fadeOut = Math.min(1, (out.length - 1 - i) / edge);
    out[i] *= scale * fadeIn * fadeOut;
  }

  return out;
}

function bell(seconds, root, { partials = [1, 2.01, 3.02], decays = [1, 0.6, 0.35] } = {}) {
  const out = make(seconds);
  partials.forEach((ratio, index) => {
    const decay = seconds * (decays[index] ?? 0.4);
    mix(
      out,
      osc(seconds, {
        freq: root * ratio,
        gain: perc(0.003 + index * 0.002, decay),
      }),
      { gain: 1 / (index + 1.6) },
    );
  });
  return out;
}

function strike(brightness = 6000, length = 0.004) {
  return filter(noise(length, { gain: perc(0.0003, length / 2.5) }), {
    cutoff: brightness,
    q: 0.7,
  });
}

function thump(seconds, from, to, decay) {
  return osc(seconds, { freq: glide(from, to, seconds * 0.6), gain: perc(0.001, decay) });
}

function knock(pitch, { length = 0.05, colour = 1500, q = 4 } = {}) {
  const out = make(length);
  mix(out, filter(noise(0.01, { gain: perc(0.0004, 0.004) }), { cutoff: colour, q }), {
    gain: 0.7,
  });
  mix(out, osc(length, { freq: pitch, gain: perc(0.001, length / 3) }), { gain: 0.5 });
  return out;
}

const FOLDERS = {
  ui: "ui",
  open: "ui",
  close: "ui",
  denied: "ui",
  levelup: "body",
  point: "body",
  transform: "body",
  revert: "body",
  rest: "body",
  hit: "combat",
  crit: "combat",
  hurt: "combat",
  snap: "combat",
  victory: "combat",
  defeat: "combat",
  forge: "craft",
  potion: "craft",
  equip: "craft",
  discard: "craft",
  growl: "wolf",
  howl: "wolf",
  beast: "wolf",
  door: "tavern",
  chat: "tavern",
};

const RECIPES = {

  ui: {
    peak: 0.42,
    forge() {
      const out = make(0.1);
      mix(out, filter(noise(0.014, { gain: perc(0.0003, 0.005) }), { cutoff: 1900, q: 1.8 }));
      mix(out, osc(0.05, { freq: glide(190, 120, 0.04), gain: perc(0.001, 0.016) }), {
        gain: 0.45,
      });
      return out;
    },
  },

  open: {
    peak: 0.5,
    forge() {
      const out = make(0.3);
      mix(
        out,
        shape(
          filter(noise(0.24), { cutoff: glide(320, 2400, 0.16), q: 1.3, mode: "bp" }),
          swell(0.045, 0.02, 0.06),
        ),
        { gain: 0.9 },
      );
      mix(out, osc(0.16, { freq: 78, gain: perc(0.012, 0.05) }), { gain: 0.5 });
      return out;
    },
  },

  close: {
    peak: 0.5,
    forge() {
      const out = make(0.3);
      mix(
        out,
        shape(
          filter(noise(0.16), { cutoff: glide(2200, 340, 0.14), q: 1.3, mode: "bp" }),
          perc(0.008, 0.055),
        ),
        { gain: 0.9 },
      );
      mix(out, knock(150, { colour: 900, q: 3 }), { at: 0.12, gain: 0.7 });
      return out;
    },
  },

  denied: {
    peak: 0.5,
    forge() {
      const out = make(0.36);
      const beat = make(0.3);
      mix(beat, osc(0.3, { wave: "triangle", freq: 104, gain: perc(0.005, 0.085) }));
      mix(beat, osc(0.3, { wave: "triangle", freq: 110.5, gain: perc(0.005, 0.075) }), {
        gain: 0.8,
      });
      mix(out, drive(filter(beat, { cutoff: 760, q: 1.1 }), 1.8));
      mix(out, filter(noise(0.05, { gain: perc(0.001, 0.014) }), { cutoff: 500, q: 0.8 }), {
        gain: 0.5,
      });
      return out;
    },
  },

  levelup: {
    peak: 0.92,
    forge() {
      const out = make(2);
      const notes = [
        { root: 293.66, at: 0, gain: 0.7 },
        { root: 440, at: 0.13, gain: 0.8 },
        { root: 587.33, at: 0.26, gain: 1 },
        { root: 880, at: 0.4, gain: 0.5 },
      ];
      for (const note of notes) {
        mix(out, bell(1.5, note.root, { decays: [0.85, 0.45, 0.28] }), {
          at: note.at,
          gain: note.gain,
        });
      }
      mix(out, osc(1.6, { freq: 73.42, gain: swell(0.18, 0.25, 0.5) }), { gain: 0.32 });
      return room(out, { time: 0.07, feedback: 0.38, mix: 0.3 });
    },
  },

  point: {
    peak: 0.55,
    forge() {
      return room(bell(0.7, 1174.66, { partials: [1, 2.76], decays: [0.42, 0.22] }), {
        time: 0.045,
        mix: 0.18,
      });
    },
  },


  transform: {
    peak: 0.94,
    forge() {
      const out = make(1.9);

      const growl = osc(1.5, {
        wave: "saw",
        freq: (t) => glide(52, 98, 1.1)(t) * (1 + 0.045 * Math.sin(2 * Math.PI * 5.4 * t)),
        gain: swell(0.22, 0.55, 0.45),
      });
      mix(out, drive(filter(growl, { cutoff: glide(900, 2600, 1.2), q: 2.2 }), 3.2), {
        gain: 0.85,
      });
      mix(out, osc(0.8, { freq: glide(46, 38, 0.7), gain: perc(0.02, 0.28) }), { gain: 0.6 });

      const cracks = [
        { at: 0.26, colour: 2600 },
        { at: 0.44, colour: 3400 },
        { at: 0.63, colour: 1900 },
        { at: 0.88, colour: 4300 },
      ];
      for (const crack of cracks) {
        mix(
          out,
          filter(noise(0.03, { gain: perc(0.0004, 0.008) }), { cutoff: crack.colour, q: 9 }),
          { at: crack.at, gain: 0.5 },
        );
        mix(out, thump(0.1, 210, 120, 0.02), { at: crack.at, gain: 0.35 });
      }

      mix(
        out,
        shape(filter(noise(0.5), { cutoff: 780, q: 1, mode: "bp" }), swell(0.08, 0.06, 0.2)),
        { at: 1.2, gain: 0.3 },
      );

      return room(out, { time: 0.065, feedback: 0.3, mix: 0.22 });
    },
  },

  revert: {
    peak: 0.72,
    forge() {
      const out = make(1.1);
      const growl = osc(0.85, {
        wave: "saw",
        freq: glide(92, 47, 0.8),
        gain: swell(0.05, 0.2, 0.35),
      });
      mix(out, drive(filter(growl, { cutoff: glide(1900, 620, 0.8), q: 1.8 }), 2.4), { gain: 0.8 });
      mix(
        out,
        shape(filter(noise(0.5), { cutoff: 560, q: 0.9, mode: "bp" }), swell(0.1, 0.05, 0.24)),
        { at: 0.42, gain: 0.42 },
      );
      return out;
    },
  },

  rest: {
    peak: 0.45,
    forge() {
      const out = make(1);
      mix(out, shape(filter(noise(0.9), { cutoff: 520, q: 0.8 }), swell(0.22, 0.1, 0.35)), {
        gain: 0.9,
      });
      mix(out, osc(0.9, { freq: 64, gain: swell(0.2, 0.12, 0.4) }), { gain: 0.35 });
      return out;
    },
  },

  hit: {
    peak: 0.95,
    forge() {
      const out = make(0.32);
      mix(out, strike(5200), { gain: 0.6 });
      mix(out, thump(0.28, 172, 88, 0.055), { gain: 1 });
      mix(out, filter(noise(0.09, { gain: perc(0.001, 0.026) }), { cutoff: 1300, q: 0.9 }), {
        gain: 0.5,
      });
      return drive(out, 1.6);
    },
  },

  crit: {
    peak: 0.94,
    forge() {
      const out = make(0.6);
      mix(out, strike(7800, 0.005), { gain: 0.75 });
      mix(out, thump(0.3, 190, 92, 0.06), { gain: 1 });
      mix(out, filter(noise(0.1, { gain: perc(0.001, 0.03) }), { cutoff: 1600, q: 0.9 }), {
        gain: 0.5,
      });
      for (const [index, hz] of [2380, 3570, 5120].entries()) {
        mix(out, osc(0.5, { freq: hz, gain: perc(0.002, 0.19 - index * 0.05) }), {
          gain: 0.22 / (index + 1),
        });
      }
      return drive(out, 1.8);
    },
  },

  hurt: {
    peak: 0.85,
    forge() {
      const out = make(0.45);
      mix(out, thump(0.4, 124, 62, 0.085), { gain: 1 });
      mix(
        out,
        shape(
          filter(osc(0.35, { wave: "saw", freq: glide(96, 74, 0.3) }), { cutoff: 620, q: 1.6 }),
          perc(0.02, 0.11),
        ),
        { gain: 0.42 },
      );
      mix(out, filter(noise(0.14, { gain: perc(0.001, 0.042) }), { cutoff: 900, q: 0.8 }), {
        gain: 0.45,
      });
      return drive(out, 1.4);
    },
  },

  victory: {
    peak: 0.9,
    forge() {
      const out = make(1.5);
      for (const [index, hz] of [196, 293.66, 392].entries()) {
        const stack = make(1.2);
        for (const detune of [-0.4, 0, 0.5]) {
          mix(stack, osc(1.2, { wave: "saw", freq: hz + detune, gain: swell(0.05, 0.3, 0.4) }));
        }
        mix(out, filter(stack, { cutoff: glide(900, 2000, 0.4), q: 1.1 }), {
          at: index * 0.09,
          gain: 0.3 / (index + 1),
        });
      }
      return room(out, { time: 0.075, feedback: 0.36, mix: 0.28 });
    },
  },

  defeat: {
    peak: 0.8,
    forge() {
      const out = make(1.8);
      const toll = make(1.6);
      for (const [index, ratio] of [1, 2.04, 2.97].entries()) {
        mix(
          toll,
          osc(1.6, {
            freq: (t) => 146.83 * ratio * (1 - 0.035 * Math.min(t / 1.4, 1)),
            gain: perc(0.006 + index * 0.004, 1.1 - index * 0.3),
          }),
          { gain: 1 / (index + 1.5) },
        );
      }
      mix(out, filter(toll, { cutoff: 940, q: 1 }));
      return room(out, { time: 0.09, feedback: 0.4, mix: 0.3 });
    },
  },

  forge: {
    peak: 0.94,
    forge() {
      const out = make(1);
      mix(out, strike(9000, 0.003), { gain: 0.9 });
      mix(out, thump(0.25, 210, 140, 0.035), { gain: 0.9 });
      for (const [index, hz] of [1867, 2803, 4139, 5710].entries()) {
        mix(
          out,
          osc(0.8, { freq: hz * (1 + index * 0.004), gain: perc(0.001, 0.42 - index * 0.09) }),
          {
            gain: 0.3 / (index + 1),
          },
        );
      }
      mix(out, filter(noise(0.3, { gain: perc(0.001, 0.09) }), { cutoff: 3100, q: 11 }), {
        gain: 0.35,
      });
      return room(drive(out, 2), { time: 0.05, feedback: 0.3, mix: 0.18 });
    },
  },

  potion: {
    peak: 0.7,
    forge() {
      const out = make(0.85);
      for (const [index, start] of [0, 0.16, 0.31].entries()) {
        mix(
          out,
          shape(
            filter(noise(0.12), { cutoff: glide(420, 880 + index * 90, 0.09), q: 7, mode: "bp" }),
            perc(0.008, 0.038),
          ),
          { at: start, gain: 0.8 },
        );
        mix(out, osc(0.1, { freq: glide(210, 330 + index * 20, 0.08), gain: perc(0.006, 0.03) }), {
          at: start,
          gain: 0.35,
        });
      }
      mix(out, osc(0.3, { freq: 3120, gain: perc(0.001, 0.06) }), { at: 0.52, gain: 0.16 });
      mix(out, osc(0.3, { freq: 4680, gain: perc(0.001, 0.04) }), { at: 0.52, gain: 0.1 });
      return out;
    },
  },

  equip: {
    peak: 0.65,
    forge() {
      const out = make(0.36);
      mix(out, shape(filter(noise(0.16), { cutoff: 820, q: 1.6, mode: "bp" }), perc(0.012, 0.05)), {
        gain: 0.7,
      });
      mix(out, thump(0.12, 130, 96, 0.03), { gain: 0.45 });
      mix(out, filter(noise(0.03, { gain: perc(0.0004, 0.007) }), { cutoff: 2700, q: 9 }), {
        at: 0.13,
        gain: 0.55,
      });
      mix(out, osc(0.12, { freq: 3180, gain: perc(0.001, 0.03) }), { at: 0.13, gain: 0.18 });
      return out;
    },
  },

  discard: {
    peak: 0.55,
    forge() {
      const out = make(0.34);
      mix(out, shape(filter(noise(0.12), { cutoff: 1100, q: 0.9 }), perc(0.006, 0.035)), {
        gain: 0.6,
      });
      mix(out, thump(0.22, 104, 68, 0.05), { gain: 0.9 });
      mix(out, thump(0.1, 88, 70, 0.02), { at: 0.13, gain: 0.3 });
      return out;
    },
  },

  door: {
    peak: 0.72,
    forge() {
      const out = make(0.85);
      const hinge = osc(0.42, {
        wave: "saw",
        freq: (t) =>
          186 + 9 * Math.sin(2 * Math.PI * 3.1 * t) + 14 * Math.sin(2 * Math.PI * 0.9 * t),
        gain: swell(0.06, 0.12, 0.14),
      });
      mix(out, drive(filter(hinge, { cutoff: 640, q: 9, mode: "bp" }), 1.6), { gain: 0.85 });
      mix(
        out,
        shape(filter(noise(0.4), { cutoff: 1500, q: 2, mode: "bp" }), swell(0.08, 0.1, 0.12)),
        {
          gain: 0.18,
        },
      );
      mix(out, knock(240, { colour: 1600, q: 6 }), { at: 0.46, gain: 0.8 });
      mix(out, thump(0.2, 120, 78, 0.045), { at: 0.46, gain: 0.5 });
      return room(out, { time: 0.06, feedback: 0.3, mix: 0.2 });
    },
  },

  chat: {
    peak: 0.4,
    forge() {
      const out = make(0.24);
      mix(out, knock(320, { colour: 1400, q: 4 }), { gain: 1 });
      mix(out, knock(400, { colour: 1700, q: 4 }), { at: 0.08, gain: 0.7 });
      return out;
    },
  },

  growl: {
    peak: 0.72,
    forge() {
      const out = make(1);
      const body = osc(0.85, {
        wave: "saw",
        freq: (t) =>
          glide(64, 52, 0.7)(t) *
          (1 + 0.09 * Math.sin(2 * Math.PI * 23 * t) + 0.04 * Math.sin(2 * Math.PI * 7.3 * t)),
        gain: swell(0.09, 0.35, 0.28),
      });
      mix(out, drive(filter(body, { cutoff: glide(520, 900, 0.5), q: 3.2 }), 3.4), { gain: 0.9 });
      mix(
        out,
        shape(filter(noise(0.8), { cutoff: 1150, q: 2.4, mode: "bp" }), swell(0.12, 0.3, 0.24)),
        { gain: 0.22 },
      );
      mix(out, osc(0.7, { freq: 41, gain: swell(0.08, 0.3, 0.25) }), { gain: 0.35 });
      return out;
    },
  },

  snap: {
    peak: 0.88,
    forge() {
      const out = make(0.4);
      mix(out, strike(4200, 0.005), { gain: 0.7 });
      mix(out, filter(noise(0.02, { gain: perc(0.0004, 0.005) }), { cutoff: 2400, q: 7 }), {
        gain: 0.6,
      });
      mix(out, filter(noise(0.02, { gain: perc(0.0004, 0.004) }), { cutoff: 3100, q: 8 }), {
        at: 0.035,
        gain: 0.45,
      });
      mix(out, thump(0.22, 150, 74, 0.045), { gain: 0.8 });
      const rasp = osc(0.24, {
        wave: "saw",
        freq: (t) => glide(88, 58, 0.2)(t) * (1 + 0.08 * Math.sin(2 * Math.PI * 26 * t)),
        gain: perc(0.006, 0.075),
      });
      mix(out, drive(filter(rasp, { cutoff: 760, q: 2.6 }), 3), { gain: 0.55 });
      mix(out, filter(noise(0.1, { gain: perc(0.002, 0.03) }), { cutoff: 1400, q: 0.9 }), {
        gain: 0.3,
      });
      return drive(out, 1.5);
    },
  },

  howl: {
    peak: 0.9,
    forge() {
      const out = make(2.4);
      const shapeOf = (t) => {
        const rise = Math.min(1, t / 0.55);
        const fall = Math.max(0, (t - 1.35) / 0.75);
        return 1 - fall * 0.42 + rise * 0;
      };
      const voice = (ratio) =>
        osc(2, {
          wave: "saw",
          freq: (t) =>
            ratio *
            (300 + 190 * Math.min(1, t / 0.5) - 150 * Math.max(0, (t - 1.3) / 0.7)) *
            (1 + 0.022 * Math.sin(2 * Math.PI * 5.2 * t) * shapeOf(t)),
          gain: swell(0.25, 0.9, 0.5),
        });

      const throat = make(2);
      mix(throat, voice(1), { gain: 1 });
      mix(throat, voice(0.5), { gain: 0.5 });

      mix(out, filter(throat, { cutoff: 780, q: 5.5, mode: "bp" }), { gain: 0.85 });
      mix(out, filter(throat, { cutoff: 1240, q: 6.5, mode: "bp" }), { gain: 0.45 });
      mix(out, filter(throat, { cutoff: 2600, q: 4, mode: "bp" }), { gain: 0.14 });
      mix(
        out,
        shape(filter(noise(2), { cutoff: 1600, q: 1.6, mode: "bp" }), swell(0.3, 0.8, 0.5)),
        { gain: 0.1 },
      );

      return room(drive(out, 1.8), { time: 0.11, feedback: 0.44, mix: 0.34 });
    },
  },

  beast: {
    peak: 0.6,
    forge() {
      const out = make(0.5);
      const chuff = osc(0.4, {
        wave: "saw",
        freq: (t) => glide(74, 56, 0.3)(t) * (1 + 0.06 * Math.sin(2 * Math.PI * 18 * t)),
        gain: perc(0.02, 0.12),
      });
      mix(out, drive(filter(chuff, { cutoff: 880, q: 2 }), 2.6), { gain: 0.9 });
      mix(out, shape(filter(noise(0.3), { cutoff: 420, q: 1, mode: "bp" }), perc(0.012, 0.1)), {
        gain: 0.35,
      });
      return out;
    },
  },
};

function wav(samples) {
  const header = Buffer.alloc(44);
  const body = Buffer.alloc(samples.length * 2);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + body.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(body.length, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    body.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }

  return Buffer.concat([header, body]);
}

function main() {
  const wanted = process.argv.slice(2);
  const names = wanted.length > 0 ? wanted : Object.keys(RECIPES);

  mkdirSync(TMP, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  for (const name of names) {
    const recipe = RECIPES[name];
    if (!recipe) {
      console.error("Sem receita para " + name);
      process.exitCode = 1;
      continue;
    }

    seed = 0x9e3779b9;
    const samples = finish(recipe.forge(), recipe.peak);
    const source = join(TMP, name + ".wav");
    const folder = FOLDERS[name] ?? "";
    const target = join(OUT, folder, name + ".ogg");
    mkdirSync(join(OUT, folder), { recursive: true });
    writeFileSync(source, wav(samples));

    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-i",
        source,
        "-c:a",
        "libvorbis",
        "-q:a",
        "6",
        "-ac",
        "1",
        target,
      ],
      { stdio: ["ignore", "ignore", "inherit"] },
    );

    const seconds = (samples.length / RATE).toFixed(2);
    console.log(name.padEnd(10) + seconds + "s  peak " + recipe.peak);
  }

  rmSync(TMP, { recursive: true, force: true });
}

main();
