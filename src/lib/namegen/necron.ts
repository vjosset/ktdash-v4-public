export function name_necron(): string {
    const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    switch (rand([0, 1])) {
        case 0:
            // From view-source:https://www.fantasynamegenerators.com/scripts/necronNames.js
            const FN1 = ["Aaho", "Adda", "Aga", "Aha", "Ahho", "Ah", "Akhe", "Ama", "Amene", "Amenho", "Anho", "Ankhese", "Anla", "Ara", "Asha", "Baqe", "Bebi", "Beke", "Bere", "Cleo", "Dakha", "Dedu", "Deme", "Dja", "Djede", "Dje", "Djo", "Duae", "Eury", "Gany", "Geme", "Gilu", "Hako", "Harkhe", "Harsio", "Hedje", "Hekenu", "Hema", "Henu", "Heqa", "Hete", "Hewe", "Hore", "Hote", "Ibi", "Ibia", "Imho", "Ina", "Ine", "Inetka", "Inte", "Ise", "Isetno", "Iuwe", "Kage", "Kape", "Karo", "Kawa", "Kha", "Khae", "Khame", "Khamu", "Khede", "Khe", "Khu", "Maga", "Mane", "Meke", "Menkau", "Menkhe", "Mentu", "Mere", "Meri", "Merne", "Mery", "Minmo", "Mutne", "Nakhto", "Nasa", "Nebu", "Nebe", "Nebne", "Necta", "Nefe", "Nehe", "Nephe", "Nimae", "Nubkhe", "Pane", "Pare", "Pawu", "Pene", "Petu", "Preho", "Psuse", "Ptahmo", "Ptole", "Qare", "Raho", "Rahe", "Rame", "Ramo", "Sahu", "Sehe", "Sekhe", "Seme", "Sense", "Senu", "Seshe", "Simu", "Tadu", "Takha", "Thutmo", "Tuta", "Udje", "Yanha"];
            const FN2 = ["bash", "basken", "bi", "biankh", "bkay", "clea", "clid", "cris", "des", "djem", "dkare", "fer", "fret", "hyt", "kare", "kauhor", "khaf", "khat", "khet", "khmet", "khmire", "khnet", "khotep", "kht", "kor", "maka", "mehyt", "menes", "menre", "mes", "mhat", "mka", "mkah", "mnisu", "mopet", "mose", "mqen", "msaf", "mun", "munzu", "nakht", "namen", "namun", "naten", "nath", "ndes", "nebti", "nebu", "nhor", "nhotekh", "nhotep", "nmut", "nna", "nru", "nu", "nut", "nza", "phren", "pses", "ptah", "qar", "qed", "ra", "ramen", "reh", "rekh", "renef", "ros", "rqa", "rtari", "ru", "rus", "s", "sankh", "sehti", "seneb", "set", "shen", "shenq", "shet", "skaf", "skhet", "snet", "sret", "t", "tamen", "tamun", "tanath", "tankh", "tari", "taruk", "taten", "tef", "tekh", "tep", "thap", "thes", "this", "thor", "tka", "wa"];

            return `${rand(FN1)} ${rand(FN2)}`;
        default:
            // Generic robot name
            const FN3 = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
            const FN4 = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

            let name = "";
            for (let i = 0; i < 2; i++) {
                name += rand(FN3);
            }
            name += "-";
            for (let i = 0; i < 5; i++) {
                name += rand(FN4);
            }

            return name;
	}
}
