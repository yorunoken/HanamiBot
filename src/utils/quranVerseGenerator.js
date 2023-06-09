async function verseGenerator() {
  const verseCount = 6237;
  const verseNumber = Math.floor(Math.random() * verseCount);

  let endpoint = `http://api.alquran.cloud/v1/ayah/${verseNumber}/editions/quran-uthmani,en.pickthall`;

  const res = await fetch(endpoint).then((res) => res.json());
  const data = res.data[1];
  return { verse: data.text, surah: `${data.surah.englishName}(${data.surah.number})`, number: data.numberInSurah.toString() };
}
module.exports = { verseGenerator };
