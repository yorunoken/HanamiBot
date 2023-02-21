const array = [ 'bocchi the rock', '+hrhd', ]

const NewArray = array.join(" ")

const IndexOf = NewArray.indexOf("+")
console.log("IndexOf:", IndexOf)

const iIndex = IndexOf-(array[0].length)
console.log("file: asd.js:9 ~ iIndex:", iIndex);

const modsArg = array[iIndex].toUpperCase().match(/[A-Z]{2}/g)
console.log("file: asd.js:12 ~ modsArg:", modsArg);

