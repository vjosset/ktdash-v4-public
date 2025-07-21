import { ucwords } from "../utils/utils";

export function name_cultist(): string {
	const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

	const name0 = ["Borther", "Nhasc", "Dahlton", "Rafn", "Geffried", "Sahben", "Coyl", "Sister", "Morigan", "Kensha", "Ionys", "Zeytha", "Blessed", "Vorya", "Yacobe", "Neesh", "Korv", "Fuella", "Mikon", "Yuneth", "Nithani", "Sorena", "Corvinus", "Godsmarked", "Philo", "Oena", "Madrach", "Herjar", "Azimundas", "Nethfrid", "Norran", "Waldemar", "Scorl", "Yennick", "Xendenarius", "Deveen"];
	const name1 = ["Selver", "", "Gemmerhal", "Iskrit", "Kanter", "Krorne", "Zuphren", "Stannas", "Farnos", "Wurn", "Cadmas", "Drillix", "Nethix", "Sanlar", "Thrikk", "Crenbek", "Reyga", "Morswain", "The Coreclaw", "Nunaveil", "The Putrescent", "Negrani", "of the Scaled Eye", "Hrancik", "Slickstone", "Brenner", "Lors'el", "Voorsk", "Carlinus", "Dherka", "Sylinus", "Kobden", "Daevos", "Dhomass", "Kalark"];

	return ucwords(`${rand(name0)} ${rand(name1)}`);
}
