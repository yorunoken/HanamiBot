const ChessWebAPI = require("chess-web-api")
const { EmbedBuilder } = require("discord.js")
exports.run = async (client, message, args, prefix) => {
  await message.channel.sendTyping()

  // assign chess api
  const chessAPI = new ChessWebAPI()
  let blitz_game = { name: `\u200B`, value: `\u200B`, inline: true }
  let rapid_game = { name: `\u200B`, value: `\u200B`, inline: true }
  let bullet_game = { name: `\u200B`, value: `\u200B`, inline: true }

  if (args.length === 0) {
    message.reply("**Please provide a username.**")
    return
  }



  let player
  try {

    player = await chessAPI.getPlayer(args[0])

  } catch (err) {
    message.reply(`**Invalid user.**`)
    return
  }

  const playerstats = await chessAPI.getPlayerStats(player.body.username)
  const ChessMatches = await chessAPI.getPlayerMatches(player.body.username)




  if (playerstats.body.chess_blitz != undefined) {
    blitz_game = { name: `**\nBlitz**`, value: `**Last Match:** <t:${playerstats.body.chess_blitz.last.date}:R>\n**Rating:** ${playerstats.body.chess_blitz.last.rating}`, inline: true }
  }

  if (playerstats.body.chess_rapid != undefined) {
    rapid_game = { name: `**\nRapid**`, value: `**Last Match:** <t:${playerstats.body.chess_rapid.last.date}:R>\n**Rating:** ${playerstats.body.chess_rapid.last.rating}`, inline: true }
  }

  if (playerstats.body.chess_bullet != undefined) {
    bullet_game = { name: `**\nBullet**`, value: `**Last Match:** <t:${playerstats.body.chess_bullet.last.date}:R>\n**Rating:** ${playerstats.body.chess_bullet.last.rating}`, inline: true }
  }




  console.log(playerstats.body)

  const joined_at = player.body.joined

  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setTitle(`Chess profile of ${player.body.username}`)
    .setURL(player.body.url)
    .setFields({ name: `Player Stats`, value: `**Joined** <t:${joined_at}:R> \n**Followers:** \`${player.body.followers?.toLocaleString()}\` • **FIDE:** \`${playerstats.body.fide?.toLocaleString()}\``, inline: false },
      rapid_game,
      blitz_game,
      bullet_game
    )

    .setThumbnail(player.body.avatar)

  message.channel.send({ embeds: [embed] })
}
exports.name = "chess"
exports.aliases = ["chess"]
exports.description = ["get stats of a user\n\n**Parameters:**\n\`username\` username of the chess player"]
exports.usage = [`chess yoruosu`]
exports.category = ["chess"]
