export function name_hierotek(): string {
    const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

	const names0 = ["Ankhep", "Tamonhak", "Eknotath", "Khotek", "Thanatar", "Amhut", "Karok", "Zan-Tep", "Unakh", "Khophec", "Tzantath", "Tahar", "Imonekh", "Trazat", "Xeoptar", "Hamanet", "Oberek", "Banatur", "Ahmnok", "Kophesh", "Teznet", "Odakhar", "Kythok", "Eknothet", "Anubitar", "Anokh", "Thotep", "Anhutek", "Ikhatar", "Thotmek", "Ramatek", "Homanat", "Taknophet", "Makhret", "", "Zanatek"];
	const names1 = ["the Unliving", "the Gilded", "the Great", "the Exalted", "the Loyal", "the Cruel", "the Storm's Eye", "the Bloodied", "the Mighty", "the Relentless", "the Unforgiving", "the Merciless", "the Glorious", "the Devoted", "the Victorious", "the Destroyer", "the Shrouded", "the Flenser", "the Unstoppable", "the Beheader", "the Impaler", "the Magnificent", "the Illuminated", "the Executioner", "the Phaeron's Hand", "of the Eternal Gaze", "the Gatekeeper", "the All-Seeing", "the All-Knowing", "the Starwalker", "the Starkiller", "the Lifetaker", "the Godbreaker", "the Torchbearer", "the Stormbringer", "the Colossus"];

    return `${rand(names0)} ${rand(names1)}`;
}
