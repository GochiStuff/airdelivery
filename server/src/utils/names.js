const namePool = [
    "Pika", "Zard", "Eevee", "Magi", "Snorlax",
    "Ditto", "Mew", "Lucar", "Goomy", "Toge",
    "Gren", "Chomp", "Infern", "Bidoof", "Sylv",
    "Scorb", "Quag", "Zoroa", "Sable", "Piplup",

    "Luffy", "Zoro", "Goku", "Vegeta", "Itachi",
    "Kakashi", "Sasuke", "Levi", "Eren", "Nami",
    "Killua", "Gon", "Gojo", "Tanji", "Nezuko",
    "Baki", "Yugi", "Natsu", "Shoto", "Lain"
];

export function getRandomName() {
    const i = Math.floor(Math.random() * namePool.length);
    return namePool[i];
}