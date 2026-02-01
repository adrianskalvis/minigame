const images = {};
const sources = {
    trees: "resources/assets/ZRPGtrees.png",
    rocks: "resources/assets/ZRPGRocks2.png",
    beach: "resources/assets/ZRPGBeach.png",
    water: "resources/assets/water.png",
    hFull: "resources/hearts/heart_full_16x16.png",
    hHalf: "resources/hearts/heart_half_16x16.png",
    hEmpty: "resources/hearts/heart_empty_16x16.png",
    castle: "resources/assets/ZRPGcastle.png",
    player: "resources/characters/Ranger-M-01.png",
    mage: "resources/characters/Townfolk-Old-M-01.png",
    princess: "resources/characters/Princess-01.png",
    ghost: "resources/characters/Ghost_Attack.png"
};

const stories = {
    1: [
        "Ikdienā suņuks spēj iemācīties apsēsties, kad pasaki Sēdi! Kā arī apgulties, kad pasaki Guli! Tās ir komandas.",
        "Vai zināji, ka arī tagad TU vari turpināt uzdot komandas datoram? To sauc par programmēšanu! 🙂",
        "Bet labi, Mēs am CodeQuest pasaulē! Mūsu mērķis ir izglābt princesi. Turpmāk Tev Burvis palīdzēs!",
        "P.S. Rakstot kodu, par garumzīmēm šoreiz neuztraucies, jo pārsvarā programmēšanas kods tiek rakstīts angļu valodā!",
        "BURVIS: Sveiks cilvēk! Tava pirmā misija ir nokļūt pie manis. Raksti iet(); un spied 'palaist' lai dotos uz priekšu.",
        "Neaizmirsti pielikt semikolu ';' beigās!"
    ],
    2: [
        "Lieliski! Programmēšana ir precīzu instrukciju došana.",
        "BURVIS: Lieto paKreisi(); paLabi(); un ietAtpakal(); lai atrastu rīkus.",
        "BURVIS: Izmanto nemt(); kad esi veiksmīgi nonācis pie kāda priekšmeta!"
    ],
    3: [
        "Sargies! Gariņš sargā ceļu.",
        "BURVIS: Liānas, kas ir tieši blakus gariņam ir bīstamas! Ja tās aiztiksi, viņš tevi noķers.",
        "BURVIS: Izmanto zobens(); tikai tām liānām, kas nav gariņa kaimiāos!"
    ]
};