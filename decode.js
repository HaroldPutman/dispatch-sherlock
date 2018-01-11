const cheerio = require("cheerio");
const request = require('request');
const tokenizer = require('sbd');

const books = require('./data/books');

const argv = process.argv.slice(2);
if (!argv[0] || !argv[1]) {
  console.log('Usage: decode asis 1-2-1\n');
  throw new Error("Missing Argument");
}

decode(argv[0], argv[1]);

/**
 * decode
 * @param ttl The book Title abbreviated (eg. tfop)
 * @param ref A string of three hyphen-separated digits (eg. 1-2-3)
 */
function decode(ttl, ref) {
  const book = books[ttl];
  const [paragraph, sentence, word] = ref.split('-');
  console.log(`Reading ${book.title} from ${book.url}...`)
  request(book.url, function (error, response, body) {
    if (error) {
      throw new Error("Error fetch document.");
    }
    const $ = cheerio.load(body);
    const method = 'book1';
    let text = null;
    switch (book.method) {
      case 'story':
        text = $(`a[name="${book.bookmark}"]`).parent().parent().nextUntil('hr','p');
        break;
      case 'story2':
        text = $(`a[name="${book.bookmark}"]`).parent().next().next().nextUntil('h2','p');
        break;
      case 'book1':
        text = $(`a[name="${book.bookmark}"]`).parent().next().nextUntil('div','p');
        break;
      case 'book2':
        text = $(`a[name="${book.bookmark}"]`).parent().nextUntil('h3','p');
        break;
      case 'book3':
        text = $(`a[name="${book.bookmark}"]`).next().next().nextUntil('h3','p');
        break;
    }
    const tp = text.eq(paragraph - 1).text().trim();
    console.log(`paragraph: ${tp}`);
    const ts = tokenizer.sentences(tp)[sentence - 1].trim();
    console.log(`sentence: ${ts}`);
    const words = ts.split(/\s+/);
    console.log(`word: ${words[word - 1]}`);
  });
}
