export function name_admech(): string {
    const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const digits = "0123456789".split("");

    const name1 = letters;
    const name2 = letters;
    const name3 = letters;
    const name4 = letters;
    const name5 = letters;
    const name6 = letters;
    const name7 = digits;
    const name8 = digits;
    const name9 = digits;

    const name10 = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega"];
    const name11 = name10.slice();

    const name12 = ["B", "C", "D", "G", "Gr", "Gw", "H", "J", "Jzz", "K", "Kr", "L", "M", "N", "Ph", "Pl", "Qv", "R", "Rh", "S", "T", "Th", "V", "X", "Y", "Z"];
    const name13 = ["ahr", "al", "an", "and", "ane", "arc", "arv", "aulk", "auss", "awl", "aym", "ea", "eard", "ei", "elt", "erg", "ess", "eth", "ex", "i", "ik", "ingh", "iv", "o", "ol", "oll", "or", "orght", "osch", "osk", "oth", "u", "ul", "und", "ure", "uss", "ux", "yrrc"];

    const name14 = ["Ad", "Adv", "Alsm", "Ar", "Arg", "Arkh", "Auk", "Aurgr", "Bess", "Caldr", "Call", "Cambr", "Carn", "Cass", "Char", "Cord", "Cum", "Cur", "Cyk", "Dal", "Damm", "Delph", "Dentr", "Drush", "Dur", "Eb", "Eg", "Eld", "Er", "Et", "Fried", "Gai", "Gall", "Gamm", "Garb", "Gast", "Gav", "Gredd", "Haph", "Herr", "Hy", "Ism", "Kelb", "Klayd", "Kol", "Kor", "Kot", "Kub", "Lak", "Lars", "Lav", "Lex", "Loc", "Lyrz", "Marl", "Modw", "Ner", "Nes", "Nex", "Nir", "Oct", "Ohmn", "Omn", "Os", "Osm", "Oud", "Ov", "Pan", "Pass", "Phaet", "Rask", "Rest", "Reyl", "Rhod", "Rol", "Ronr", "Sap", "Sas", "Sem", "Shur", "Son", "Tall", "Tayb", "Tel", "Tezl", "Them", "Threns", "Tilv", "Trag", "Trant", "Uix", "Vai", "Vak", "Varn", "Veltr", "Vett", "Vherr", "Vianc", "Volt", "Weyldr", "Xix", "Zab", "Zagr", "Zard", "Zhok", "Zyg"];
    const name15 = ["a", "ak", "al", "an", "and", "ane", "ank", "anx", "aph", "ard", "as", "ax", "eb", "eg", "ek", "ell", "en", "ene", "ent", "er", "eum", "eus", "ex", "ia", "ian", "ias", "id", "iel", "ien", "ik", "ike", "il", "in", "iom", "ion", "is", "isch", "ium", "ius", "ix", "o", "ode", "ok", "ol", "olph", "on", "ook", "or", "os", "ot", "ov", "owe", "u", "ul", "um", "us", "uul", "uv", "yon"];

    const name16 = ["Abb", "Aex", "Ald", "Alm", "Alph", "Balph", "Bell", "Ben", "Bet", "Borg", "Cerv", "Cort", "Cyc", "Cyth", "Danz", "Dec", "Deg", "Del", "Delt", "Diad", "Drac", "Drayk", "Eps", "Er", "Faust", "Fel", "Gel", "Ger", "Gerg", "Hed", "Held", "Herm", "Herst", "Hol", "Hyp", "Iap", "Ill", "Inf", "Ipl", "Khob", "Kor", "Krypt", "Laur", "Malth", "Mank", "Mass", "Max", "Mitr", "Moh", "Moj", "Om", "Orl", "Os", "Pal", "Prod", "Reg", "Rom", "Saph", "Sat", "Ser", "Sig", "Sol", "Tell", "Thass", "Ther", "Torqu", "Trim", "Urqu", "Val", "Vard", "Ver", "Veth", "Vidr", "Vitr", "Zod", "Zuh"];
    const name17 = ["ad", "aestr", "ag", "ak", "al", "all", "am", "an", "and", "andr", "ant", "ar", "asm", "at", "athr", "av", "ebr", "ed", "ej", "ekr", "ent", "er", "err", "esw", "et", "euk", "iat", "iatr", "ic", "id", "il", "ill", "im", "in", "ing", "ir", "is", "off", "om", "on", "or", "ot", "ovd", "ow", "ul", "ur", "urm", "ut", "uv"];
    const name18 = ["a", "ac", "ael", "ain", "al", "an", "ar", "ax", "ei", "el", "en", "er", "ex", "i", "ia", "iad", "ian", "iaz", "ict", "icz", "id", "ien", "in", "ine", "io", "ion", "is", "ius", "ix", "o", "on", "or", "os", "oth", "ov", "um", "us", "ust"];

    const name19 = ["Ak", "Ant", "Arc", "Bart", "Bel", "Daed", "Eyr", "Fed", "Ger", "Gif", "Hext", "Hier", "Iv", "Katr", "Ol", "Ozm"];
    const name20 = ["al", "asn", "eg", "ell", "erh", "err", "ig", "is", "og", "ol", "on", "or", "oth", "um"];
    const name21 = ["ad", "am", "ar", "in", "iv", "ol", "om", "on", "oph", "os", "ost", "ov", "ym"];
    const name22 = ["a", "ax", "ere", "ich", "il", "ion", "is", "ius", "o", "on", "or", "us"];

    const name31 = [" ", " ", " ", " ", " ", "-", " van ", " van der "];

    const format = Math.floor(Math.random() * 20);

    switch (format) {
        case 0:
            return `${rand(name7)}${rand(name8)}-${rand(name12)}${rand(name13)}`;
        case 1:
            return `${rand(name10)} ${rand(name7)}-${rand(name12)}${rand(name13)}`;
        case 2:
            return `${rand(name14)}${rand(name15)} ${rand(name7)}${rand(name8)}/${rand(name9)} ${rand(name14)}${rand(name15)}`;
        case 3:
            return `${rand(name10)}-${rand(name11)} ${rand(name7)}${rand(name8)}`;
        case 4:
            return `${rand(name1)}-${rand(name2)} ${rand(name3)}${rand(name7)}${rand(name4)}/${rand(name5)}${rand(name8)}${rand(name6)}`;
        case 5:
            return `${rand(name1)}${rand(name2)}-${rand(name7)}${rand(name8)}${rand(name9)}`;
        case 6:
            return `${rand(name1)}-${rand(name7)}${rand(name8)}${rand(name9)}`;
        case 7:
            return `${rand(name14)}${rand(name15)}-${rand(name10)}-${rand(name7)}`;
        case 8:
            return `${rand(name12)}${rand(name13)}${rand(name31)}${rand(name14)}${rand(name15)}`;
        case 9:
            return `${rand(name12)}${rand(name13)} ${rand(name16)}${rand(name17)}${rand(name18)}`;
        case 10:
            return `${rand(name12)}${rand(name13)} ${rand(name19)}${rand(name20)}${rand(name21)}${rand(name22)}`;
        case 11:
            return `${rand(name14)}${rand(name15)}${rand(name31)}${rand(name12)}${rand(name13)}`;
        case 12:
            return `${rand(name14)}${rand(name15)} ${rand(name16)}${rand(name17)}${rand(name18)}`;
        case 13:
            return `${rand(name14)}${rand(name15)} ${rand(name19)}${rand(name20)}${rand(name21)}${rand(name22)}`;
        case 14:
            return `${rand(name16)}${rand(name17)}${rand(name18)}${rand(name31)}${rand(name12)}${rand(name13)}`;
        case 15:
            return `${rand(name16)}${rand(name17)}${rand(name18)}${rand(name31)}${rand(name14)}${rand(name15)}`;
        case 16:
            return `${rand(name19)}${rand(name20)}${rand(name21)}${rand(name22)}${rand(name31)}${rand(name12)}${rand(name13)}`;
        case 17:
            return `${rand(name19)}${rand(name20)}${rand(name21)}${rand(name22)}${rand(name31)}${rand(name14)}${rand(name15)}`;
        case 18:
            return `${rand(name14)}${rand(name15)} ${rand(name12)}${rand(name13)}-${rand(name12)}${rand(name13)}`;
        case 19:
            return `${rand(name16)}${rand(name17)}${rand(name18)} ${rand(name12)}${rand(name13)}-${rand(name12)}${rand(name13)}`;
        default:
            return `${rand(name16)}${rand(name17)}${rand(name18)} ${rand(name12)}${rand(name13)}-${rand(name12)}${rand(name13)}`;
    }
}
