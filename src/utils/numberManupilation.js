/**
 *
 * @param {number} number - The number you want to add an article in front of.
 * @param {boolean} capital - Whether or not the first character of it should be capital or not
 * @returns {string} - The article.
 */

function articles(number, capital) {
  let article = "a";
  const lastTwoDigits = Math.abs(number % 100);

  if (lastTwoDigits === 8 || lastTwoDigits === 11 || lastTwoDigits === 18 || lastTwoDigits === 80) {
    article = "an";
  }
  if (capital) {
    article = article[0].toUpperCase() + article.slice(1);
  }

  return article;
}

/**
 *
 * @param {number} number - The number
 * @returns {string} - The suffix.
 */

function suffixes(number) {
  let suffix = "th";

  const lastTwoDigits = Math.abs(number % 100);
  if (lastTwoDigits === 11 || lastTwoDigits === 12 || lastTwoDigits === 13) {
    suffix = "th";
  } else {
    const lastDigit = lastTwoDigits % 10;

    if (lastDigit === 1) {
      suffix = "st";
    }
    if (lastDigit === 2) {
      suffix = "nd";
    }
    if (lastDigit === 3) {
      suffix = "rd";
    }
  }

  return suffix;
}

module.exports = { articles, suffixes };
