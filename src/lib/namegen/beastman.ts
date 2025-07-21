import { ucwords } from "../utils/utils";

export function name_beastman(): string {
	const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

	// Gibberish first
	const gib1 = ["b", "d", "g", "gh", "k", "kn", "kh", "m", "n", "t", "th", "v", "z", "zh"];
	const gib2 = ["a", "o", "u", "a", "o", "u", "a", "o", "u", "a", "o", "u", "a", "o", "u", "e", "i", "e", "i", "au", "ao", "aa", "oo"];
	const gib3 = ["cr", "cn", "cc", "cv", "cth", "g", "gh", "gth", "gd", "gdh", "k", "kh", "kz", "kk", "kr", "kt", "kth", "l", "lg", "lgh", "lgr", "ltr", "lc", "n", "ng", "nk", "nc", "r", "rr", "rz", "rg", "rk", "rkr", "rgh", "rth", "zr", "zg", "zc", "zk", "zz"];
	const gib4 = ["c", "g", "k", "r", "x", "z"];

	// Descriptive second
	const desc1 = ["amber", "ashen", "battle", "bitter", "black", "blazing", "bleeding", "blood", "bright", "bristle", "broad", "brown", "chaos", "cinder", "dark", "dawn", "dead", "death", "ember", "fallen", "fiery", "fire", "flame", "frozen", "giant", "gloom", "gore", "grand", "gray", "great", "grim", "grizzly", "heavy", "hell", "iron", "keen", "lightning", "lone", "metal", "molten", "moon", "morning", "moss", "mountain", "nether", "night", "onyx", "plain", "proud", "pyre", "rage", "rapid", "rough", "rumble", "serpent", "shadow", "sharp", "shatter", "silent", "silver", "slug", "solid", "spring", "star", "steel", "stern", "stone", "storm", "strong", "swift", "thunder", "wild"];
	const desc2 = ["arm", "bane", "belly", "belt", "braid", "breath", "brow", "chest", "chin", "claw", "coat", "crest", "eye", "eyes", "fang", "fangs", "feet", "finger", "fingers", "fist", "foot", "gaze", "grip", "gut", "hair", "hand", "hands", "head", "heart", "hide", "jaw", "mane", "manes", "mantle", "maw", "mouth", "paw", "pelt", "ridge", "scar", "shoulder", "shoulders", "snout", "spine", "tail", "teeth", "toe", "toes", "tongue", "tooth", "wound"];

	switch (rand([0, 1])) {
		case 0:
			// Use a gibberish name
			return ucwords(`${rand(gib1)}${rand(gib2)}${rand(gib3)}${rand(gib4)}`);
		default:
			// Use a descriptive name
			return ucwords(`${rand(desc1)}${rand(desc2)}`);
	}
}
