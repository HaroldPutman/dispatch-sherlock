const cheerio = require('cheerio');
const request = require('request');
const tokenizer = require('sbd');

const books = require('./data/books');

const argv = process.argv.slice(2);
if (!argv[0] || !argv[1]) {
  console.log('Usage: decode asis 1-2-1\n');
  throw new Error('Missing Argument');
}

decode(argv[0], argv[1]);

/**
 * decode
 * @param ttl The book Title abbreviated (eg. tfop)
 * @param ref A string of three hyphen-separated digits (eg. 1-2-3)
 * @return The word in question.
 */
function decode(ttl, ref) {
  const book = books[ttl];
  const [paragraph, sentence, word] = ref.split('-');
  console.log(`Reading ${book.title} from ${book.url}...`);
  request(book.url, function(error, response, body) {
    if (error) {
      throw new Error('Error fetch document.');
    }
    const pars = processHtml(body, book.bookmark, book.method);
    if (paragraph > pars.length) {
      throw new Error(`ERROR: Paragraph ${paragraph} does not exist.`);
    }
    const sents = pars[paragraph - 1].text;
    if (sentence > sents.length) {
      console.log(sents.join(' '));
      throw new Error(`ERROR: There is no sentence ${sentence} in paragraph ${paragraph}.`);
    }
    const words = sents[sentence - 1].split(/[ ,]+/);
    if (word > words.length) {
      console.log(sents[sentence - 1]);
      throw new Error(`ERROR: There is no word ${word} in sentence ${sentence} of paragraph ${paragraph}.`);
    }
    console.log(words[word - 1]);
  });
}

/**
 * Turn HTML body into an array of paragraphs of text.
 * @param source The HTML page body
 * @param bookmark The bookmark id used to find the text.
 * @param method The predefined method used to isolate the text.
 * @return An array of paragraph objects {paragraph: #, text: []}
 */
function processHtml(source, bookmark, method) {
    const $ = cheerio.load(source);
    let text = null;
    switch (method) {
      case 'story':
        text = $(`a[name="${bookmark}"]`)
          .parent()
          .parent()
          .nextUntil('hr', 'p');
        break;
      case 'story2':
        text = $(`a[name="${bookmark}"]`)
          .parent()
          .next()
          .next()
          .nextUntil('h2', 'p');
        break;
      case 'book1':
        text = $(`a[name="${bookmark}"]`)
          .parent()
          .next()
          .nextUntil('div', 'p');
        break;
      case 'book2':
        text = $(`a[name="${bookmark}"]`)
          .parent()
          .nextUntil('h3', 'p');
        break;
      case 'book3':
        text = $(`a[name="${bookmark}"]`)
          .next()
          .next()
          .nextUntil('h3', 'p');
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
    let v = text.eq(1);
    // console.log(v.text());
    return text.map(function(i, el) {
      const p = $(this)
        .text()
        .replace(/\s+/g,' ') // Collapse spaces
        .replace(/[“”"]/g,'') // Remove quotes
        .trim(); // remove leading and trailing spaces
      return {
        paragraph: i + 1,
        text: (p) ? tokenizer.sentences(p) : null
      };
    }).get();
}
