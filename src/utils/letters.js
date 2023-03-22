const Georgian = {
	a: "ა",
	b: "ბ",
	g: "გ",
	d: "დ",
	e: "ე",
	v: "ვ",
	z: "ზ",
	t: "თ",
	i: "ი",
	k: "კ",
	l: "ლ",
	m: "მ",
	n: "ნ",
	f: "",
	o: "ო",
	p: "პ",
	jh: "ჟ",
	r: "რ",
	s: "ს",
	"t’": "ტ",
	u: "უ",
	f: "ფ",
	q: "ქ",
	gh: "ღ",
	y: "ყ",
	ch: "ჩ",
	c: "ც",
	dz: "ძ",
	ts: "ც",
	sh: "შ",
	w: "ჭ",
	kh: "ხ",
	x: "ხ",
	j: "ჯ",
	h: "ჰ",
};

const Japanese = {
	/**
	syllables
	*/
	a: "あ",
	i: "い",
	u: "う",
	e: "え",
	o: "お",

	/**
	chiisai tsu
	*/
	k: "っ",
	s: "っ",
	t: "っ",
	h: "っ",
	m: "っ",
	y: "っ",
	r: "っ",
	w: "っ",

	/**
	Monographs 
	*/
	ka: "か",
	ki: "き",
	ku: "く",
	ke: "け",
	ko: "こ",

	sa: "さ",
	si: "し",
	su: "す",
	se: "せ",
	so: "そ",

	ta: "た",
	chi: "ち",
	tsu: "つ",
	te: "て",
	to: "と",

	na: "な",
	ni: "に",
	nu: "ぬ",
	ne: "ね",
	no: "の",

	ha: "は",
	hi: "ひ",
	fu: "ふ",
	he: "へ",
	ho: "ほ",

	ma: "ま",
	mi: "み",
	mu: "む",
	me: "め",
	mo: "も",

	ya: "や",
	yu: "ゆ",
	yo: "よ",

	ra: "ら",
	ri: "り",
	ru: "る",
	re: "れ",
	ro: "ろ",

	wa: "わ",
	wi: "ゐ",
	we: "ゑ",
	wo: "を",

	/**
	Digraphs 
	*/
	kya: "きゃ",
	kyu: "きゅ",
	kyo: "きょ",

	sha: "しゃ",
	shu: "しゅ",
	sho: "しょ",

	cha: "ちゃ",
	chu: "ちゅ",
	cho: "ちょ",

	nya: "にゃ",
	nyu: "にゅ",
	nyo: "にょ",

	hya: "ひゃ",
	hyu: "ひゅ",
	hyo: "ひょ",

	mya: "みゃ",
	myu: "みゅ",
	myo: "みょ",

	rya: "りゃ",
	ryu: "りゅ",
	ryo: "りょ",

	/**
	Monographs with diacritics 
	*/
	ga: "が",
	gi: "ぎ",
	gu: "ぐ",
	ge: "げ",
	go: "ご",

	za: "ざ",
	ji: "じ",
	zu: "ず",
	ze: "ぜ",
	zo: "ぞ",

	da: "だ",
	dji: "ぢ",
	dzu: "づ",
	de: "で",
	do: "ど",

	ba: "ば",
	bi: "び",
	bu: "ぶ",
	be: "べ",
	bo: "ぼ",

	pa: "ぱ",
	pi: "ぴ",
	pu: "ぷ",
	pe: "ぺ",
	po: "ぽ",

	/**
	Digraphs with diacritics
	*/
	gya: "ぎゃ",
	gyu: "ぎゅ",
	gyo: "ぎょ",

	ja: "じゃ",
	ju: "じゅ",
	jo: "じょ",
	jya: "じゃ",
	jyu: "じゅ",
	jyo: "じょ",

	dja: "ぢゃ",
	dju: "ぢゅ",
	djo: "ぢょ",

	bya: "びゃ",
	byu: "びゃ",
	byo: "びょ",

	pya: "ぴゃ",
	pyu: "ぴゅ",
	pyo: "ぴょ",

	/**
	nasal monograph 
	*/

	n: "ん",
};

module.exports = { letters: { Georgian, Japanese } };
