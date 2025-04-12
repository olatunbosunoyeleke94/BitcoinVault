// Mock Bitcoin utilities for MVP
const SATS_PER_BTC = 100_000_000;

// Extended word list for more entropy
const WORD_LIST = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
  "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
  "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
  "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
  "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol",
  "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already",
  "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused",
  "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle",
  "announce", "annual", "another", "answer", "antenna", "antique", "anxiety",
  "any", "apart", "apology", "appear", "apple", "approve", "april", "arch",
  "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around",
  "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork"
];

function getRandomWord(): string {
  // Use crypto random for better randomness
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return WORD_LIST[array[0] % WORD_LIST.length];
}

export function generateMnemonic(): string {
  return Array(12).fill(0)
    .map(() => getRandomWord())
    .join(" ");
}

export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().toLowerCase().split(" ");
  return words.length === 12 && words.every(word => WORD_LIST.includes(word));
}

export function generateAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return "1" + Array(33).fill(0)
    .map(() => {
      const array = new Uint8Array(1);
      crypto.getRandomValues(array);
      return chars[array[0] % chars.length];
    })
    .join("");
}

export function estimateFee(amount: number): number {
  // Mock fee calculation - 1% of amount or minimum 1000 sats
  return Math.max(Math.floor(amount * 0.01), 1000);
}

export function satoshisToBTC(sats: number): string {
  return (sats / SATS_PER_BTC).toFixed(8);
}

export function btcToSatoshis(btc: string): number {
  return Math.floor(parseFloat(btc) * SATS_PER_BTC);
}

export function validateAddress(address: string): boolean {
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
}