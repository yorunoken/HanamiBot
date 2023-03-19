const getMaxNextLine = (input, maxChars = 20) => {
	// Split the string into an array of words.
	const allWords = input.split(" ")
	// Find the index in the words array at which we should stop or we will exceed
	// maximum characters.
	const lineIndex = allWords.reduce((prev, cur, index) => {
		if (prev?.done) return prev
		const endLastWord = prev?.position || 0
		const position = endLastWord + 1 + cur.length
		return position >= maxChars ? { done: true, index } : { position, index }
	})
	// Using the index, build a string for this line ...
	const line = allWords.slice(0, lineIndex.index).join(" ")
	// And determine what's left.
	const remainingChars = allWords.slice(lineIndex.index).join(" ")
	// Return the result.
	return { line, remainingChars }
}

exports.formatTitle = title => {
	let output = []

	if (title.length >= 40) {
		const firstLine = getMaxNextLine(title)
		const secondLine = getMaxNextLine(firstLine.remainingChars)
		output = [firstLine.line]
		let fmSecondLine = secondLine.line
		if (secondLine.remainingChars.length > 0) fmSecondLine += " ..."
		output.push(fmSecondLine)
	} else if (title.length >= 20) {
		const firstLine = getMaxNextLine(title, title.length / 2)
		output = [firstLine.line, firstLine.remainingChars]
	} else {
		output = [title]
	}

	return output
}
