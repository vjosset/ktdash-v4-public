
export function name_ork(): string {
    const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

	const names1 = ["b", "br", "ch", "d", "dh", "dr", "g", "gh", "gr", "hr", "k", "kh", "kr", "m", "n", "r", "sk", "sm", "sn", "t", "tr", "v", "vr", "w", "wr", "z", "zh", "zr", "", "", "", "", ""];
	const names2 = ["a", "i", "o", "u", "a", "u"];
	const names3 = ["b", "d", "dbr", "dr", "g", "gb", "gd", "gg", "gh", "gn", "gt", "gz", "hrbl", "k", "kg", "kk", "kt", "lgr", "nz", "r", "rb", "rg", "rgn", "rgr", "rk", "rkr", "rl", "rz", "sk", "skr", "t", "tgr", "tzm", "tzn", "zdr", "zg", "zgr"];
	const names4 = ["a", "o", "u"];
	const names5 = ["d", "g", "gar", "gas", "gg", "gus", "k", "kh", "kk", "m", "nak", "r", "rd", "rk", "x", "z", "zak", "zz",];
	const names6 = ["Barb", "Battle", "Big", "Blood", "Blud", "Bone", "Brain", "Crook", "Crown", "Dark", "Dome", "Doom", "Dream", "Ead", "Ed", "Face", "Fire", "Fist", "Gloom", "Glum", "God", "Gore", "Grave", "Grim", "Gut", "Gutz", "Hed", "Hell", "Ice", "Iron", "Jaw", "Jowl", "Kill", "Klaw", "Krook", "Mad", "Mighty", "Mug", "Muzzle", "Rabid", "Rage", "Rekk", "Rock", "Scalp", "Skar", "Skull", "Slay", "Strong", "War", "Wild"];
	const names7 = ["acka", "ackah", "basha", "bashah", "boila", "boilah", "braka", "brakah", "brakka", "brakkah", "breaka", "breakah", "busta", "choppa", "choppah", "cleava", "cleavah", "clompa", "clompah", "cooka", "cookah", "cracka", "crackah", "crasha", "crashah", "crumpa", "crumpah", "crusha", "crushah", "cutta", "cuttah", "dagga", "daggah", "fang", "fist", "gasha", "gashah", "gutta", "guttah", "hacka", "hackah", "kleava", "kleavah", "krak", "kraka", "krakah", "krumpa", "krumpah", "krusha", "krushah", "rippa", "rippah", "shredda", "shreddah", "skar", "skorcha", "skorchah", "slasha", "slashah", "smasha", "smashah", "snagga", "snaggah", "snappa", "snappah", "spitta", "spittah", "splitta", "splittah", "stampa", "stampah", "stompa", "stompah", "trasha", "trashah", "wakka", "wakkah", "whacka", "whackah"];

	// Two modes: 1+2+3+4+5 or 6+7
    switch(rand([0, 1])) {
        case 0:
            return `${rand(names1)}${rand(names2)}${rand(names3)}${rand(names4)}${rand(names5)}`;
        default:
            return `${rand(names6)}${rand(names7)}`;
    }
}
