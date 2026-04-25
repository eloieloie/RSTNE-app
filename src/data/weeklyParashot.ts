export interface ParashaReading {
  displayText: string;
  bookSlug: string;
  startChapter: number;
}

export interface Parasha {
  week: number;
  hebrewName: string;
  torah: ParashaReading;
  newCovenant: ParashaReading;
}

export const WEEKLY_PARASHOT: Parasha[] = [
  {
    week: 1,
    hebrewName: "Beresheeth",
    torah: { displayText: "Genesis 1–4", bookSlug: "genesis", startChapter: 1 },
    newCovenant: { displayText: "Matthew 1–6", bookSlug: "matthew", startChapter: 1 },
  },
  {
    week: 2,
    hebrewName: "Ahdahm v'Chawa",
    torah: { displayText: "Genesis 5–8", bookSlug: "genesis", startChapter: 5 },
    newCovenant: { displayText: "Matthew 7–11", bookSlug: "matthew", startChapter: 7 },
  },
  {
    week: 3,
    hebrewName: "Vayevarech",
    torah: { displayText: "Genesis 9–12", bookSlug: "genesis", startChapter: 9 },
    newCovenant: { displayText: "Matthew 12–16", bookSlug: "matthew", startChapter: 12 },
  },
  {
    week: 4,
    hebrewName: "Vayaal Avram",
    torah: { displayText: "Genesis 13–16", bookSlug: "genesis", startChapter: 13 },
    newCovenant: { displayText: "Matthew 17–21", bookSlug: "matthew", startChapter: 17 },
  },
  {
    week: 5,
    hebrewName: "Va'yhee Avram",
    torah: { displayText: "Genesis 17–20", bookSlug: "genesis", startChapter: 17 },
    newCovenant: { displayText: "Matthew 22–26", bookSlug: "matthew", startChapter: 22 },
  },
  {
    week: 6,
    hebrewName: "V'HWHY Paqad",
    torah: { displayText: "Genesis 21–24", bookSlug: "genesis", startChapter: 21 },
    newCovenant: { displayText: "Matthew 27–28", bookSlug: "matthew", startChapter: 27 },
  },
  {
    week: 7,
    hebrewName: "Vayoseph Avraham",
    torah: { displayText: "Genesis 25–28", bookSlug: "genesis", startChapter: 25 },
    newCovenant: { displayText: "Mark 1–5", bookSlug: "mark", startChapter: 1 },
  },
  {
    week: 8,
    hebrewName: "Vayesah Yaaqov Raglav",
    torah: { displayText: "Genesis 29–32", bookSlug: "genesis", startChapter: 29 },
    newCovenant: { displayText: "Mark 6–10", bookSlug: "mark", startChapter: 6 },
  },
  {
    week: 9,
    hebrewName: "Vayesah Yaaqov Einav",
    torah: { displayText: "Genesis 33–36", bookSlug: "genesis", startChapter: 33 },
    newCovenant: { displayText: "Mark 11–16", bookSlug: "mark", startChapter: 11 },
  },
  {
    week: 10,
    hebrewName: "Vayeshev",
    torah: { displayText: "Genesis 37–40", bookSlug: "genesis", startChapter: 37 },
    newCovenant: { displayText: "Luke 1–5", bookSlug: "luke", startChapter: 1 },
  },
  {
    week: 11,
    hebrewName: "Miqeitz",
    torah: { displayText: "Genesis 41–44", bookSlug: "genesis", startChapter: 41 },
    newCovenant: { displayText: "Luke 6–10", bookSlug: "luke", startChapter: 6 },
  },
  {
    week: 12,
    hebrewName: "V'lo Yachol",
    torah: { displayText: "Genesis 45–48", bookSlug: "genesis", startChapter: 45 },
    newCovenant: { displayText: "Luke 11–15", bookSlug: "luke", startChapter: 11 },
  },
  {
    week: 13,
    hebrewName: "Vayiqra Yaaqov",
    torah: { displayText: "Genesis 49–50, Exodus 1–2", bookSlug: "genesis", startChapter: 49 },
    newCovenant: { displayText: "Luke 16–20", bookSlug: "luke", startChapter: 16 },
  },
  {
    week: 14,
    hebrewName: "U'Mosha Haya",
    torah: { displayText: "Exodus 3–6", bookSlug: "exodus", startChapter: 3 },
    newCovenant: { displayText: "Luke 21–24", bookSlug: "luke", startChapter: 21 },
  },
  {
    week: 15,
    hebrewName: "Re'eh Ne'tatecha",
    torah: { displayText: "Exodus 7–10", bookSlug: "exodus", startChapter: 7 },
    newCovenant: { displayText: "John 1–5", bookSlug: "john", startChapter: 1 },
  },
  {
    week: 16,
    hebrewName: "Od Nega Echad",
    torah: { displayText: "Exodus 11–14", bookSlug: "exodus", startChapter: 11 },
    newCovenant: { displayText: "John 6–10", bookSlug: "john", startChapter: 6 },
  },
  {
    week: 17,
    hebrewName: "Az Yashir Mosha",
    torah: { displayText: "Exodus 15–18", bookSlug: "exodus", startChapter: 15 },
    newCovenant: { displayText: "John 11", bookSlug: "john", startChapter: 11 },
  },
  {
    week: 18,
    hebrewName: "Ba' Chodesh Ha'shlishi",
    torah: { displayText: "Exodus 19–22", bookSlug: "exodus", startChapter: 19 },
    newCovenant: { displayText: "John 12–16", bookSlug: "john", startChapter: 12 },
  },
  {
    week: 19,
    hebrewName: "Lo Tisa",
    torah: { displayText: "Exodus 23–26", bookSlug: "exodus", startChapter: 23 },
    newCovenant: { displayText: "John 17–21", bookSlug: "john", startChapter: 17 },
  },
  {
    week: 20,
    hebrewName: "Hamizbe'ach",
    torah: { displayText: "Exodus 27–30", bookSlug: "exodus", startChapter: 27 },
    newCovenant: { displayText: "Acts 1–5", bookSlug: "acts", startChapter: 1 },
  },
  {
    week: 21,
    hebrewName: "Betzalel",
    torah: { displayText: "Exodus 31–34", bookSlug: "exodus", startChapter: 31 },
    newCovenant: { displayText: "Acts 6–10", bookSlug: "acts", startChapter: 6 },
  },
  {
    week: 22,
    hebrewName: "Vayakel Mosha",
    torah: { displayText: "Exodus 35–38", bookSlug: "exodus", startChapter: 35 },
    newCovenant: { displayText: "Acts 11–15", bookSlug: "acts", startChapter: 11 },
  },
  {
    week: 23,
    hebrewName: "Oo-Min Ha'tchelet",
    torah: { displayText: "Exodus 39–40, Leviticus 1–2", bookSlug: "exodus", startChapter: 39 },
    newCovenant: { displayText: "Acts 16–20", bookSlug: "acts", startChapter: 16 },
  },
  {
    week: 24,
    hebrewName: "V'im Zevach Shlamim",
    torah: { displayText: "Leviticus 3–6", bookSlug: "leviticus", startChapter: 3 },
    newCovenant: { displayText: "Acts 21–25", bookSlug: "acts", startChapter: 21 },
  },
  {
    week: 25,
    hebrewName: "Torat Ha-Asham",
    torah: { displayText: "Leviticus 7–10", bookSlug: "leviticus", startChapter: 7 },
    newCovenant: { displayText: "Acts 26–28", bookSlug: "acts", startChapter: 26 },
  },
  {
    week: 26,
    hebrewName: "Zot Hachaya",
    torah: { displayText: "Leviticus 11–14", bookSlug: "leviticus", startChapter: 11 },
    newCovenant: { displayText: "James 1–5", bookSlug: "james", startChapter: 1 },
  },
  {
    week: 27,
    hebrewName: "Ki Yeyeh Zav",
    torah: { displayText: "Leviticus 15–18", bookSlug: "leviticus", startChapter: 15 },
    newCovenant: { displayText: "Hebrews 1–5", bookSlug: "hebrews", startChapter: 1 },
  },
  {
    week: 28,
    hebrewName: "Kedoshim Teeh'Yu",
    torah: { displayText: "Leviticus 19–22", bookSlug: "leviticus", startChapter: 19 },
    newCovenant: { displayText: "Hebrews 6–13", bookSlug: "hebrews", startChapter: 6 },
  },
  {
    week: 29,
    hebrewName: "Moadei HWHY",
    torah: { displayText: "Leviticus 23–26", bookSlug: "leviticus", startChapter: 23 },
    newCovenant: { displayText: "1 Peter 1–5", bookSlug: "first-peter", startChapter: 1 },
  },
  {
    week: 30,
    hebrewName: "Yaflee Nehder",
    torah: { displayText: "Leviticus 27, Numbers 1–3", bookSlug: "leviticus", startChapter: 27 },
    newCovenant: { displayText: "2 Peter 1–3", bookSlug: "second-peter", startChapter: 1 },
  },
  {
    week: 31,
    hebrewName: "Nasa Et Rosh",
    torah: { displayText: "Numbers 4–7", bookSlug: "numbers", startChapter: 4 },
    newCovenant: { displayText: "1 John 1–5", bookSlug: "first-john", startChapter: 1 },
  },
  {
    week: 32,
    hebrewName: "Baha'Alotcha",
    torah: { displayText: "Numbers 8–10", bookSlug: "numbers", startChapter: 8 },
    newCovenant: { displayText: "2 John, 3 John & Jude", bookSlug: "second-john", startChapter: 1 },
  },
  {
    week: 33,
    hebrewName: "Vayehee Ha'Am",
    torah: { displayText: "Numbers 11–14", bookSlug: "numbers", startChapter: 11 },
    newCovenant: { displayText: "Romans 1–5", bookSlug: "romans", startChapter: 1 },
  },
  {
    week: 34,
    hebrewName: "Kee Tavo'oo",
    torah: { displayText: "Numbers 15–18", bookSlug: "numbers", startChapter: 15 },
    newCovenant: { displayText: "Romans 6–10", bookSlug: "romans", startChapter: 6 },
  },
  {
    week: 35,
    hebrewName: "Zot Chukat HaTorah",
    torah: { displayText: "Numbers 19–22", bookSlug: "numbers", startChapter: 19 },
    newCovenant: { displayText: "Romans 11–13", bookSlug: "romans", startChapter: 11 },
  },
  {
    week: 36,
    hebrewName: "Balak",
    torah: { displayText: "Numbers 23–26", bookSlug: "numbers", startChapter: 23 },
    newCovenant: { displayText: "Romans 14–16", bookSlug: "romans", startChapter: 14 },
  },
  {
    week: 37,
    hebrewName: "Banot Tzelaphechad",
    torah: { displayText: "Numbers 27–30", bookSlug: "numbers", startChapter: 27 },
    newCovenant: { displayText: "1 Corinthians 1–5", bookSlug: "first-corinthians", startChapter: 1 },
  },
  {
    week: 38,
    hebrewName: "N'kam Nikmat B'nai Yasrahal",
    torah: { displayText: "Numbers 31–34", bookSlug: "numbers", startChapter: 31 },
    newCovenant: { displayText: "1 Corinthians 6–10", bookSlug: "first-corinthians", startChapter: 6 },
  },
  {
    week: 39,
    hebrewName: "V'nat'nu LaLewiyim",
    torah: { displayText: "Numbers 35–36, Deuteronomy 1–2", bookSlug: "numbers", startChapter: 35 },
    newCovenant: { displayText: "1 Corinthians 11–16", bookSlug: "first-corinthians", startChapter: 11 },
  },
  {
    week: 40,
    hebrewName: "Derech HaBashan",
    torah: { displayText: "Deuteronomy 3–6", bookSlug: "deuteronomy", startChapter: 3 },
    newCovenant: { displayText: "2 Corinthians 1–5", bookSlug: "second-corinthians", startChapter: 1 },
  },
  {
    week: 41,
    hebrewName: "Ki Yeviyacha",
    torah: { displayText: "Deuteronomy 7–10", bookSlug: "deuteronomy", startChapter: 7 },
    newCovenant: { displayText: "2 Corinthians 6–10", bookSlug: "second-corinthians", startChapter: 6 },
  },
  {
    week: 42,
    hebrewName: "V'Ahavtah",
    torah: { displayText: "Deuteronomy 11–14", bookSlug: "deuteronomy", startChapter: 11 },
    newCovenant: { displayText: "2 Corinthians 11–13", bookSlug: "second-corinthians", startChapter: 11 },
  },
  {
    week: 43,
    hebrewName: "Miqetz",
    torah: { displayText: "Deuteronomy 15–18", bookSlug: "deuteronomy", startChapter: 15 },
    newCovenant: { displayText: "Galatians 1–6", bookSlug: "galatians", startChapter: 1 },
  },
  {
    week: 44,
    hebrewName: "Ki Yachrit",
    torah: { displayText: "Deuteronomy 19–22", bookSlug: "deuteronomy", startChapter: 19 },
    newCovenant: { displayText: "Ephesians 1–6", bookSlug: "ephesians", startChapter: 1 },
  },
  {
    week: 45,
    hebrewName: "Yikach",
    torah: { displayText: "Deuteronomy 23–26", bookSlug: "deuteronomy", startChapter: 23 },
    newCovenant: { displayText: "Philippians 1–4", bookSlug: "philippians", startChapter: 1 },
  },
  {
    week: 46,
    hebrewName: "Vayitzav",
    torah: { displayText: "Deuteronomy 27–30", bookSlug: "deuteronomy", startChapter: 27 },
    newCovenant: { displayText: "Colossians 1–4", bookSlug: "colossians", startChapter: 1 },
  },
  {
    week: 47,
    hebrewName: "Vayelech",
    torah: { displayText: "Deuteronomy 31–32", bookSlug: "deuteronomy", startChapter: 31 },
    newCovenant: { displayText: "1 Thessalonians 1–5", bookSlug: "first-thessalonians", startChapter: 1 },
  },
  {
    week: 48,
    hebrewName: "V'Zot HaBracha",
    torah: { displayText: "Deuteronomy 33–34", bookSlug: "deuteronomy", startChapter: 33 },
    newCovenant: { displayText: "2 Thessalonians 1–3, Philemon", bookSlug: "second-thessalonians", startChapter: 1 },
  },
  {
    week: 49,
    hebrewName: "V'Yavo Yoseph",
    torah: { displayText: "Genesis 47–50", bookSlug: "genesis", startChapter: 47 },
    newCovenant: { displayText: "1 Timothy 1–6", bookSlug: "first-timothy", startChapter: 1 },
  },
  {
    week: 50,
    hebrewName: "HaChodesh Hazeh",
    torah: { displayText: "Exodus 12–13, Leviticus 25–26", bookSlug: "exodus", startChapter: 12 },
    newCovenant: { displayText: "Titus 1–3", bookSlug: "titus", startChapter: 1 },
  },
  {
    week: 51,
    hebrewName: "Vayisu",
    torah: { displayText: "Numbers 22–25", bookSlug: "numbers", startChapter: 22 },
    newCovenant: { displayText: "Revelation 9–13", bookSlug: "revelation", startChapter: 9 },
  },
  {
    week: 52,
    hebrewName: "Shema",
    torah: { displayText: "Deuteronomy 4–6 & 31–34", bookSlug: "deuteronomy", startChapter: 4 },
    newCovenant: { displayText: "Revelation 14–22", bookSlug: "revelation", startChapter: 14 },
  },
];
