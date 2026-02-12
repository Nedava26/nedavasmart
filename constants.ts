
import { EventSlot, Fidele } from './types';

export const DONATION_CATEGORIES: string[] = ['SHABAT', 'FETES DE TICHRI', 'FETES', 'AUTRES'];
export const BANK_ACCOUNTS: string[] = ['Beith Yossef', 'Mishkan Yehuda', 'Atrid', 'Yahad Naale'];

export const OFFICES = ['Arvit 1', 'Chaharit 1', 'Minha', 'Arvit 2', 'Chaharit 2'];

// Modèles structurés
export const SHABBAT_TEMPLATE: EventSlot[] = [
  "Ehal", "1er Sepher", "2eme Sepher", "3eme Sepher", "Agbaa",
  "1ere montee", "2eme montee", "3eme montee", "4eme montee",
  "5eme montee", "6eme montee", "7eme montee", "Maftir"
].map(name => ({ name, office: 'Chaharit 1' }));

export const ROCH_HACHANA_TEMPLATE: EventSlot[] = [
  // Block 1 - Chaharit 1
  ...["Parnassa", "Ehal", "1er Sepher", "2eme Sepher", "Agbaa", "1ere montee", "2eme montee", "3eme montee", "4eme montee", "5eme montee", "6eme montee", "7eme montee", "Maftir", "Et shaarer Raxon"].map(name => ({ name, office: 'Chaharit 1' })),
  // Block 2 - Arvit 1
  ...["Parnassa", "Ehal", "1er Sepher", "Agbaa", "1ere montee", "2eme montee", "3eme montee"].map(name => ({ name, office: 'Arvit 1' })),
  // Block 3 - Chaharit 2
  ...["Parnassa", "Ehal", "1er Sepher", "Agbaa", "1ere montee", "2eme montee", "3eme montee", "4eme montee", "5eme montee", "Maftir", "Et shaarer Raxon"].map(name => ({ name, office: 'Chaharit 2' })),
  // Block 4 - Minha
  { name: "Parnassa", office: 'Minha' }
];

export const YOM_KIPPOUR_TEMPLATE: EventSlot[] = [
  // Block 1 - Arvit 1 (Kol Nidrei)
  ...["Ehal", "1er Sepher (Kol Nidrei)", "2eme Sepher", "3eme Sepher", "4eme Sepher", "5eme Sepher", "6eme Sepher", "7eme Sepher", "8eme Sepher", "Parnassa"].map(name => ({ name, office: 'Arvit 1' })),
  // Block 2 - Rimonim
  ...["Rimonim", "Rimonim", "Rimonim", "Rimonim"].map(name => ({ name, office: 'Arvit 1' })),
  // Block 3 - Chaharit 1
  ...["Ehal", "1er Sepher", "2eme Sepher", "Agbaa", "1er montee", "2eme montee", "3eme montee", "4eme montee", "5eme montee", "6eme montee", "7eme montee", "Maftir"].map(name => ({ name, office: 'Chaharit 1' })),
  // Block 4 - Chaharit 1 (Suite)
  { name: "Seder Avoda", office: 'Chaharit 1' },
  { name: "Parnassa", office: 'Chaharit 1' },
  // Block 5 - Minha
  ...["Ehal", "1er Sepher", "Agbaa", "1ere montee", "2eme montee", "Maftir", "Et shaarer Raxon"].map(name => ({ name, office: 'Minha' })),
  // Block 6 - Arvit 2 (Neila)
  { name: "Neila", office: 'Arvit 2' },
  { name: "Hatan Torah", office: 'Arvit 2' },
  { name: "Hatan Berechit", office: 'Arvit 2' },
  { name: "Hatan Meona", office: 'Arvit 2' }
];

export const SIMHA_TORAH_TEMPLATE: EventSlot[] = [
  // Block 1 - Arvit 1
  ...["Ehal", "1er Sepher", "2eme Sepher", "3eme Sepher", "4eme Sepher", "5eme Sepher", "6eme Sepher", "7eme Sepher", "8eme Sepher", "9eme Sepher", "1ere Akafa", "2eme Akafa", "3eme Akafa", "4eme Akafa", "5eme Akafa", "6eme Akafa", "7eme Akafa"].map(name => ({ name, office: 'Arvit 1' })),
  // Block 2 - Chaharit 1
  ...["Ehal", "1er Sepher", "2eme Sepher", "3eme Sepher", "Agbaa", "1ere montee", "2eme montee", "3eme montee", "4eme montee", "5eme montee", "6eme montee", "7eme montee", "Maftir", "Tikoun Agechem"].map(name => ({ name, office: 'Chaharit 1' })),
  // Block 3 - Arvit 2
  ...["Ehal", "1er Sepher", "2eme Sepher", "3eme Sepher", "4eme Sepher", "5eme Sepher", "6eme Sepher", "7eme Sepher", "8eme Sepher", "9eme Sepher", "1ere Akafa", "2eme Akafa", "3eme Akafa", "4eme Akafa", "5eme Akafa", "6eme Akafa", "7eme Akafa"].map(name => ({ name, office: 'Arvit 2' }))
];

const RAW_FIDEL_LIST = `Acher Nathanael
Afuta Laurent
Aidan Samuel
Alali Rudy
Aliani Ariel
Alimi Axel
Alimi Avraham (pere Eric)
Alimi Chalom
Amar Meir
Amar Patrick
Amram Pierre
Amsellem Steeve
Amsellem Bof Haim
Anna 
Arbib Yair
Arbib Isaac
Arbib Yoni
Arfi Reuven
Arfi Ariel
Atlan Laurent
Atlan Gad
Attal Benoit
Attias Jordan
Avitan Nadav
Ayache Gabriel
Ayache Laurent
Ayache Miha
Ayache Yoni
Azerad Juda
Azerad Simon
Bajer Raphael
Bakouche Adam
Balouka Johnathan
Bchri Jeremie
Benaim John
Benamou Aaron
Benamou Jeremy
Benamou Serge
Benamou Yann
Benmoussa Yoram
Benaroche Daniel
Benaroche Yona
Benattar Luc
Benguigui David
Benguigui Mickael
Benini Italien
Benisti Johnathan
Bensehemon Ouri
Benshabat Benjamin
Berdah Avraham
Berdah Ciryl
Berdah Ilan
Berdah Michel
Berdugo Charles
Berdugo Raphael
Betan Arie
Betan Maurice
Bittan Marc
Bitton Alain
Bitton Meir
Bitton Serge
Bitton Yaacov
Bitton Yonathan
Brami Benjamin
Bouzaglo Yoni
Chaouat Ludovic
Chauvart Henry
Chauvart Rony
Chocron Alain
Chocron Raphael
Cohana David
Cohen Dan
Cohen Edouard
Cohen Joel/ Alexandra
Cohen Meir
Cohen Ravuski
Cohen Serge
Dahan Lyor
El Eini Hermann
Elbaz Eithan
Elfersi Chay
Elfersi Fred
Eliaou Jacky
Fitoussi Laurent
Franco Patrick
Galleto Elie
Gozlan Marc
Gozlan Olivier
Guedj David
Guedj Paul
Guedj Rudy
Guedj Shalom
Guetta Yossef
Guili Lionel
Haddad Jeremy
Hadjad Hen
Hadouk Goel
Hadouk Yoni
Hertzel Israelien
Ichay Simon
Israel Fils
Israel Raphael
Izraelewicz Alexandre
Journo Stephane
Kabalo Prosper
Kabalo Yoni
Kadosh Yohan
Kazola Yona
Knafo David
Kolecher Adam
Koskas Laurent
Krief Laurent
Labiod Henri
Levy Charli
Levy David
Levy Efraim
Levy Maurice
Levy Samuel
Livarek Stephane
Malka Gabriel
Mamane David
Mamane Ofer
Marciano David
Marciano Daniel
Marciano Joseph
Marciano Julien
Marciano Mendel
Marciano Mickael
Marciano Noam
Mass David
Meloul Igal
Mickael (Dj LA)
Msihid Ilan
Nabet (Alain Biton)
Obadia David
Obadia Greg
Obadia Samuel
Ofer Yonathan
Ostier Greg
Parienti Dorone
Partouche Reuven
Pere Ofer Maman
Perez Laurent
Portal Haim
Renassia Jacques
Reuven Elie
Reuven Youval
Saada Isaac
Saadoun Maxime
Salomon Nathan
Salomon Dan
Salomon Jeremy
Salomon Vincent
Sayada Bryan
Sayag Manu
Sebag David
Sebag Elie
Sebag Philippe
Sebag Yohan
Seban Guerson
Selam David
Seror Elon
Seror Jacques
Sfez Raphael
Simhone Haim
Simhone Nathanael
Simhone Yehuda
Slevinsky Fabrice
Sportes Marc
Taieb Samuel
Tapiro Sydney
Techuva Gabriel
Timsit Robert
Torjman Yoram
Tobelem Mickael
Tsion Madlal
Uzan Shem Tov
Ventura Anthony
Ventura David
Ventura Jonathan
Vingante Stephane
Weil Benjamin
Zanzouri Nathanael
Zeev Adam
Zeitoun Benjamin
Zemmour Philippe
Zerbib Samuel`;

export const DEFAULT_FIDELES: Fidele[] = RAW_FIDEL_LIST.split('\n')
  .filter(line => line.trim())
  .map((line, index) => {
    const parts = line.trim().split(' ');
    const nom = parts[0].toUpperCase();
    const prenom = parts.slice(1).join(' ') || "";
    return {
      id: `imported-${index}`,
      nom,
      prenom,
      mail: "",
      telephone: "",
      paysResidence: "France",
      preferenceRecu: "Aucun",
      montantDu: 0,
      montantPaye: 0,
      totalPromesses: 0,
      status: "RECENT",
      dateCreation: new Date().toISOString()
    };
  });

export const RAW_EVENTS = [
  { name: "Roch Hachana", category: "FETES DE TICHRI", date: "2025-09-23" },
  { name: "Shabat Vayeleh", category: "SHABAT", date: "2025-09-27" },
  { name: "Berakhot de l'annee", category: "AUTRES", date: "2025-09-23" },
  { name: "Places Femme Yom Kippour", category: "FETES DE TICHRI", date: "2025-10-02" },
  { name: "Places Hommes Yom Kippour", category: "FETES DE TICHRI", date: "2025-10-02" },
  { name: "Yom Kipour", category: "FETES DE TICHRI", date: "2025-10-02" },
  { name: "Hatan Torah + Berichit + Meona", category: "FETES DE TICHRI", date: "2025-10-15" },
  { name: "Shabat Haazinou", category: "SHABAT", date: "2025-10-04" },
  { name: "Soucot", category: "FETES DE TICHRI", date: "2025-10-07" },
  { name: "Shabat Soucot", category: "FETES DE TICHRI", date: "2025-10-11" },
  { name: "Simha Torah - Chemini Atseret", category: "FETES DE TICHRI", date: "2025-10-15" },
  { name: "Shabat Berechit", category: "SHABAT", date: "2025-10-18" },
  { name: "Shabat Noah", category: "SHABAT", date: "2025-10-25" },
  { name: "Shabat Leh Leha", category: "SHABAT", date: "2025-11-01" },
  { name: "Shabat Vayera", category: "SHABAT", date: "2025-11-08" },
  { name: "Shabat Haye Sarah", category: "SHABAT", date: "2025-11-15" },
  { name: "Shabat Toledot", category: "SHABAT", date: "2025-11-22" },
  { name: "Shabat Vayexe", category: "SHABAT", date: "2025-11-29" },
  { name: "Shabat Vayishlah", category: "SHABAT", date: "2025-12-06" },
  { name: "Shabat Vayeshev", category: "SHABAT", date: "2025-12-13" },
  { name: "Shabat Miketz", category: "SHABAT", date: "2025-12-20" },
  { name: "Shabat Vayigach", category: "SHABAT", date: "2025-12-27" },
  { name: "Shabat Vayehi", category: "SHABAT", date: "2026-01-03" },
  { name: "Shemot", category: "SHABAT", date: "2026-01-10" },
  { name: "Vaera", category: "SHABAT", date: "2026-01-17" },
  { name: "Bo", category: "SHABAT", date: "2026-01-24" },
  { name: "Bechalah", category: "SHABAT", date: "2026-01-31" },
  { name: "Ytro", category: "SHABAT", date: "2026-02-07" },
  { name: "Michpatim", category: "SHABAT", date: "2026-02-14" },
  { name: "Terouma", category: "SHABAT", date: "2026-02-21" },
  { name: "Tetsave", category: "SHABAT", date: "2026-02-28" },
  { name: "Kitissa", category: "SHABAT", date: "2026-03-07" },
  { name: "Vayekel", category: "SHABAT", date: "2026-03-14" },
  { name: "Pekoudei", category: "SHABAT", date: "2026-03-14" },
  { name: "Vayikra", category: "SHABAT", date: "2026-03-21" },
  { name: "Xav", category: "SHABAT", date: "2026-03-28" },
  { name: "Shabat Pessah (1ere Fete)", category: "FETES", date: "2026-04-02" },
  { name: "Pessah (2eme Fete)", category: "FETES", date: "2026-04-09" },
  { name: "Shabat Chemini", category: "SHABAT", date: "2026-04-18" },
  { name: "Shabat Tazria-Metsora", category: "SHABAT", date: "2026-04-25" },
  { name: "Shabat Aharei Mot-Kedochim", category: "SHABAT", date: "2026-05-02" },
  { name: "Shabat Emor", category: "SHABAT", date: "2026-05-09" },
  { name: "Shabat Behar-Behoukotay", category: "SHABAT", date: "2026-05-16" },
  { name: "Shabat Bamidbar", category: "SHABAT", date: "2026-05-23" },
  { name: "Chavouot", category: "FETES", date: "2026-05-22" },
  { name: "Shabat Nasso", category: "SHABAT", date: "2026-05-30" },
  { name: "Shabat Bealotekha", category: "SHABAT", date: "2026-06-06" },
  { name: "Shabat Shelah", category: "SHABAT", date: "2026-06-13" },
  { name: "Shabat Korah", category: "SHABAT", date: "2026-06-20" },
  { name: "Shabat Houkat", category: "SHABAT", date: "2026-06-27" },
  { name: "Shabat Balak", category: "SHABAT", date: "2026-07-04" },
  { name: "Pinhas", category: "SHABAT", date: "2026-07-11" },
  { name: "Shabat Matot-Maasei", category: "SHABAT", date: "2026-07-18" },
  { name: "Shabat Devarim", category: "SHABAT", date: "2026-07-25" },
  { name: "Shabat Vaethanane", category: "SHABAT", date: "2026-08-01" },
  { name: "Shabat Ekev", category: "SHABAT", date: "2026-08-08" },
  { name: "Shabat Ree", category: "SHABAT", date: "2026-08-15" },
  { name: "Shabat Choftim", category: "SHABAT", date: "2026-08-22" },
  { name: "Shabat Ki tetse", category: "SHABAT", date: "2026-08-29" },
  { name: "Shabat Ki tavo", category: "SHABAT", date: "2026-09-05" },
  { name: "Shabat Nitsavim", category: "SHABAT", date: "2026-09-12" }
];
