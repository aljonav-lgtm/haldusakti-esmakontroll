/** Kasutajaliidese tekstid ühes kohas. Vastutuse piirang on CLAUDE.md-s kinnitatud kujul. */

export const RAKENDUSE_NIMI = "Haldusakti esmakontroll";

export const RAKENDUSE_KIRJELDUS =
  "Rakendus aitab tuvastada haldusakti tekstis vormilisi tunnuseid. Tulemus ei ole õiguslik hinnang.";

export const VASTUTUSE_PIIRANG =
  "Kontrolli tulemus on abistav ega kujuta endast õiguslikku hinnangut. Rakendus tuvastab tekstis vormilisi tunnuseid ja märksõnu, kuid ei hinda haldusakti sisulist õiguspärasust. Lõpliku hinnangu peab andma pädev inimene.";

/** Tekst, millest lühem sisend saab hoiatuse. */
export const LUHIKESE_TEKSTI_PIIR = 200;

export const TEATED = {
  tuhiSisend: "Sisesta kontrollimiseks haldusakti tekst.",
  failPuudub: "Vali fail. Nupp „Kontrolli dokumenti“ muutub aktiivseks pärast teksti eraldamist.",
  luhikeTekst:
    "Sisestatud tekst on väga lühike. Kontrolli, kas dokument on täielikult sisestatud.",
  viganeVorming: "Faili vorming ei ole toetatud. Vali TXT-, PDF- või DOCX-fail.",
  liigaSuur: "Fail on liiga suur (üle 5 MB).",
  loetamatuFail:
    "Faili ei õnnestunud lugeda. Fail võib olla vigane. Proovi teist faili või kleebi tekst vahekaardil „Sisesta tekst“.",
  tekstiPole:
    "Failist ei leitud loetavat teksti. Kontrolli, et fail ei ole tühi, või kleebi tekst vahekaardil „Sisesta tekst“.",
  pdfTekstiPole:
    "PDF-failist ei leitud loetavat teksti. Tõenäoliselt on tegemist skannitud PDF-iga, mille tekstituvastus (OCR) ei kuulu esimesse versiooni. Kleebi tekst vahekaardil „Sisesta tekst“.",
  pdfParool:
    "PDF-fail on parooliga kaitstud ja seda ei saa lugeda. Kasuta kaitseta faili või kleebi tekst vahekaardil „Sisesta tekst“.",
  kodeering:
    "Fail on loetud, kuid selle kodeering ei paista olevat UTF-8. Osa tähemärke võib olla valesti kuvatud.",
  failLoetud: "Fail on loetud ja kontrollimiseks valmis.",
  analuusHiljem: "Analüüs lisatakse järgmises etapis.",
  tulemusedTuhjad:
    "Kontrolli tulemused kuvatakse siin pärast dokumendi kontrollimist.",
} as const;
