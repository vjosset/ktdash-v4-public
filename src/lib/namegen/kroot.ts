import { ucwords } from "../utils/utils";

export function name_kroot(): string {
	const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

	const name0 = ["Kra", "Gohk", "Ahkra", "Dohra", "Cho", "Byakh", "Grahm", "Khor", "Ohrak", "Tehk", "Chok", "Khrek", "Tobok", "Obak", "Grark", "Byahm", "Doryc", "Te", "Khrob", "Jiynko", "Ahoc", "Obyn", "Anghor", "Avhra", "Yuka", "Doakh", "Byek", "Gho", "Lucu", "Tohra", "Dra", "Ahahk", "Gerba", "Alhar", "Bakor", "Tebek"];
	const name1 = ["'to", " Cha", "'ka", "'yo", " Grok", "'ah", "'ohk", " Ek", "'tcha", "", "'ya", " Ahk", " Ba", "'tcho", "'ke", " Ot", " Ak", "'hrakh", " Che", "'yc", " Khe", "", "'grahk", "'ab", "'cha", " Ohk", " Ye", "'grekh", " Da", "'gr", " Ekh", " Yo", "'eht", "", " Rek", "'tche"];
	const name2 = ["Gota", "Krrah", "Ch'choh", "Tohrrok", "Ga'ah", "Kyrek", "Ghorka", "Drr'rr", "Yo'toh", "Rhekk", "Prok", "Teleb", "Talar", "Pre'lek", "Yrr'dk", "Goba", "Ta'bak", "Ga'toh", "Yabek", "Cho'yar", "Rhehor", "Kaa'he", "Rrok", "Kyr'am", "Mebekh", "Batam", "Dyr'yn", "Gabt", "Krarh", "Yr'be", "Drekh", "Orak", "Caroch", "Akchan", "Trosk", "Belet"];

	return ucwords(`${rand(name0)}${rand(name1)} ${rand(name2)}`);
}
