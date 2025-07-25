import { ucwords } from "../utils/utils";

export function name_tau(): string {
	const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

	const names1 = ["Aun'El", "Aun'La", "Aun'O", "Aun'Ui", "Aun'Vre", "Fio'El", "Fio'La", "Fio'O", "Fio'Ui", "Fio'Vre", "Kor'El", "Kor'La", "Kor'O", "Kor'Ui", "Kor'Vre", "Por'El", "Por'La", "Por'O", "Por'Ui", "Por'Vre", "Shas'El", "Shas'La", "Shas'O", "Shas'Saal", "Shas'Ui", "Shas'Vre"];
	const names2 = ["Au'taal", "Bor'kan", "Bork'an", "D'yanoi", "Dal'yth", "Elsy'eir", "Es'Tau", "Fal'shia", "Fi'rios", "Ho'sarn", "Ka'mais", "Ke'lshan", "Ksi'm'yen", "Me'lek", "Mu'gulath", "N'dras", "Pech", "Sa'cea", "Sha'draig", "T'au", "T'olku", "T'ros", "Tash'var", "Tau'n", "Vash'ya", "Velk'Han", "Vespid", "Vior'la"];
	const names3 = ["Al", "Ar", "Ash", "Bant", "Bra", "Bun", "Dia", "Dor", "Dra", "Fio", "Fir", "Fral", "Gir", "Gra", "Gras", "Har", "Hia", "Hova", "Inio", "Ir", "Irah", "Jax", "Jila", "Jol", "Kes", "Ko", "Krin", "Man", "Mira", "Mon", "Nar", "Nase", "Nori", "Ora", "Orna", "Oxa", "Pax", "Pira", "Prin", "Resh", "Ria", "Ril", "Shase", "Shi", "Sio", "Tor", "Tsu", "Tsua", "Var", "Vra", "Vura", "Wran", "Wua", "Wura", "Xira", "Xo", "Xral"];
	const names4 = ["'are", "'ath", "'ax", "'bash", "'bin", "'bur", "'dax", "'dis", "'dras", "'elo", "'en", "'erk", "'fa", "'fel", "'fin", "'ga", "'gos", "'gri", "'ha", "'hin", "'hos", "'jash", "'jin", "'jor", "'kir", "'ko", "'kran", "'la", "'las", "'len", "'me", "'min", "'mor", "'na", "'nera", "'nesh", "'or", "'os", "'osh", "'par", "'pin", "'pras", "'ra", "'rak", "'rax", "'sha", "'shash", "'som", "'taga", "'ter", "'tin", "'un", "'ur", "'us", "'vash", "'vax", "'vren", "'wer", "'werd", "'wra", "'xan", "'xil", "'xo", "'yr", "ah", "al", "aln", "an", "ara", "arn", "ash", "ax", "eh", "el", "en", "er", "erra", "es", "esh", "eth", "ina", "ir", "ira", "irn", "irr", "ish", "ith", "ix", "o", "oh", "ol", "om", "on", "or", "ot", "oth", "u", "ug", "un", "ur", "urn", "us", "uth", "ux"];

	return ucwords(`${rand(names1)} ${rand(names2)} ${rand(names3)}${rand(names4)}`);
}
