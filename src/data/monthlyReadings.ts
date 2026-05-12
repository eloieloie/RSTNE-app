export interface MonthlyPassage {
  displayText: string;
  bookSlug: string;
  startChapter: number;
}

export interface MonthlyHaftarah {
  month: number;
  hebrewName: string;
  passages: MonthlyPassage[];
}

export const MONTHLY_HAFTAROT: MonthlyHaftarah[] = [
  {
    month: 1,
    hebrewName: "Aviv / Nissan",
    passages: [
      { displayText: "Isaiah 42:5–43:10", bookSlug: "isaiah", startChapter: 42 },
      { displayText: "Jeremiah 46:13–28", bookSlug: "jeremiah", startChapter: 46 },
    ],
  },
  {
    month: 2,
    hebrewName: "Iyar / Ziv",
    passages: [
      { displayText: "Hosea 12:13–14:10", bookSlug: "hosea", startChapter: 12 },
      { displayText: "Isaiah 9:1–6", bookSlug: "isaiah", startChapter: 9 },
      { displayText: "Isaiah 49:1–6", bookSlug: "isaiah", startChapter: 49 },
    ],
  },
  {
    month: 3,
    hebrewName: "Sivan",
    passages: [
      { displayText: "Hosea 11:7–12:12", bookSlug: "hosea", startChapter: 11 },
      { displayText: "Isaiah 60:1–22", bookSlug: "isaiah", startChapter: 60 },
    ],
  },
  {
    month: 4,
    hebrewName: "Tammuz",
    passages: [
      { displayText: "Ezekiel 37:15–28", bookSlug: "ezekiel", startChapter: 37 },
      { displayText: "Isaiah 61:1–63:9", bookSlug: "isaiah", startChapter: 61 },
    ],
  },
  {
    month: 5,
    hebrewName: "Av",
    passages: [
      { displayText: "Judges 4:4–5:31", bookSlug: "judges", startChapter: 4 },
      { displayText: "Hosea 14:2–10", bookSlug: "hosea", startChapter: 14 },
    ],
  },
  {
    month: 6,
    hebrewName: "Elul",
    passages: [
      { displayText: "Isaiah 6:1–7:14", bookSlug: "isaiah", startChapter: 6 },
      { displayText: "Joshua 1:1–18", bookSlug: "joshua", startChapter: 1 },
    ],
  },
  {
    month: 7,
    hebrewName: "Tishrei / Etanim",
    passages: [
      { displayText: "Isaiah 53:1–12", bookSlug: "isaiah", startChapter: 53 },
      { displayText: "Hosea 2:1–22", bookSlug: "hosea", startChapter: 2 },
    ],
  },
  {
    month: 8,
    hebrewName: "Cheshvan / Bul",
    passages: [
      { displayText: "1 Kings 18:1–39", bookSlug: "first-kings", startChapter: 18 },
      { displayText: "Jeremiah 16:19–17:14", bookSlug: "jeremiah", startChapter: 16 },
    ],
  },
  {
    month: 9,
    hebrewName: "Kislev",
    passages: [
      { displayText: "Isaiah 43:21–44:23", bookSlug: "isaiah", startChapter: 43 },
      { displayText: "Amos 9:7–15", bookSlug: "amos", startChapter: 9 },
    ],
  },
  {
    month: 10,
    hebrewName: "Tevet",
    passages: [
      { displayText: "Jeremiah 34:8–22", bookSlug: "jeremiah", startChapter: 34 },
      { displayText: "Jeremiah 31:31–34", bookSlug: "jeremiah", startChapter: 31 },
    ],
  },
  {
    month: 11,
    hebrewName: "Shevat",
    passages: [
      { displayText: "Micah 5:6–6:8", bookSlug: "micah", startChapter: 5 },
      { displayText: "Jeremiah 1:1–2:3", bookSlug: "jeremiah", startChapter: 1 },
    ],
  },
  {
    month: 12,
    hebrewName: "Adar",
    passages: [
      { displayText: "Isaiah 1:1–27", bookSlug: "isaiah", startChapter: 1 },
      { displayText: "Isaiah 40:1–26", bookSlug: "isaiah", startChapter: 40 },
    ],
  },
];
