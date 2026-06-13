const fs = require('fs');
const https = require('https');

const strings = JSON.parse(fs.readFileSync('arabic_strings.json', 'utf-8'));
const translations = {};

const delay = ms => new Promise(res => setTimeout(res, ms));

const translate = (text) => {
  return new Promise((resolve, reject) => {
    https.get('https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=' + encodeURIComponent(text), res => {
      let d = '';
      res.on('data', c => d+=c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d)[0][0][0]);
        } catch (e) {
          resolve(text); // Fallback to original
        }
      });
    }).on('error', reject);
  });
};

async function run() {
  console.log(`Starting translation of ${strings.length} strings...`);
  for (let i = 0; i < strings.length; i++) {
    const s = strings[i];
    try {
      const en = await translate(s);
      translations[s] = en;
      console.log(`[${i+1}/${strings.length}] ${s} -> ${en}`);
    } catch(e) {
      console.error(e);
      translations[s] = s;
    }
    await delay(100);
  }
  fs.writeFileSync('translate_dictionary.json', JSON.stringify(translations, null, 2));
  console.log('Translations saved to translate_dictionary.json');
}

run();
