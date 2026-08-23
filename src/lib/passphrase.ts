/**
 * Client-side generators for the two password modes. Both use crypto RNG.
 * Nothing here is stored server-side — the value is shown once and relayed
 * out-of-band by the sender.
 */

// ~256 short, readable, unambiguous words. 4 words ≈ 32 bits of entropy.
const WORDS = [
  "amber", "anchor", "apple", "arch", "arrow", "aspen", "atlas", "aurora",
  "basil", "beacon", "bison", "blaze", "bloom", "bramble", "breeze", "bronze",
  "brook", "cactus", "canyon", "cedar", "cinder", "citron", "clay", "cliff",
  "clover", "cobalt", "comet", "coral", "cove", "crane", "crest", "crimson",
  "crystal", "cyan", "dawn", "delta", "dew", "diamond", "dune", "dusk",
  "eagle", "echo", "ember", "fable", "falcon", "fern", "flint", "forest",
  "fox", "frost", "garnet", "glacier", "glade", "gold", "granite", "grove",
  "harbor", "hawk", "hazel", "heron", "hollow", "indigo", "iris", "island",
  "ivory", "jade", "jasper", "jungle", "juniper", "kelp", "kite", "lagoon",
  "lantern", "lark", "laurel", "lemon", "lily", "linen", "lotus", "lunar",
  "lynx", "magnet", "maple", "marble", "marsh", "meadow", "mesa", "mint",
  "mist", "moon", "moss", "nectar", "nimbus", "north", "oak", "oasis",
  "ocean", "olive", "onyx", "opal", "orbit", "orchid", "otter", "palm",
  "pebble", "petal", "pine", "pixel", "planet", "plum", "pond", "poppy",
  "prairie", "quartz", "quill", "quilt", "rain", "raven", "reef", "ridge",
  "river", "robin", "rocket", "rose", "ruby", "rune", "saffron", "sage",
  "sand", "sapphire", "scarlet", "shadow", "shell", "silk", "silver", "sky",
  "slate", "sleet", "snow", "solar", "sparrow", "spruce", "star", "stone",
  "storm", "stream", "summit", "sunset", "swan", "teal", "tempo", "thistle",
  "thunder", "tide", "tiger", "topaz", "torch", "trail", "tulip", "tundra",
  "vale", "velvet", "vine", "violet", "vista", "voyage", "walnut", "wave",
  "willow", "wind", "winter", "wolf", "wren", "zenith", "zephyr", "zinc",
];

function randomInt(max: number): number {
  // Rejection sampling for an unbiased index in [0, max).
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

/** e.g. "amber-tiger-cloud-river". */
export function generatePassphrase(wordCount = 4): string {
  const picked: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    picked.push(WORDS[randomInt(WORDS.length)]);
  }
  return picked.join("-");
}

/** e.g. "482913". */
export function generateCode(digits = 6): string {
  let out = "";
  for (let i = 0; i < digits; i++) {
    out += randomInt(10).toString();
  }
  return out;
}
