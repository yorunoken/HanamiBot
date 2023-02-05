const { EmbedBuilder: E_builder_manga } = require('discord.js');
const MFA = require('mangadex-full-api');
exports.run = async (client, message, args, prefix, EmbedBuilder) => { 
    await message.channel.sendTyping()

    async function GetManga(manga){
    try{
    //define genre tags
    const genretags = manga.tags.filter(tag => tag.group === "genre")
    const genres = genretags.map(tag => tag.localizedName.en)

    //define latest chapter
    const chapters = await manga.getFeed({ translatedLanguage: ['en'] }, true)
    const latestchapter = chapters.sort((a, b) => b.chapter - a.chapter)[0];
    const firstchapter = chapters.sort((a, b) => a.chapter - b.chapter)[0];

    //define cover
    const cover = await MFA.Manga.getCovers(manga.id)
    const lastcover = cover.sort((a, b) => b.volume - a.volume)[0]
    const firstcover = cover.sort((a, b) => a.volume - b.volume)[0]

    //define statistics of manga
    const stats = await MFA.Manga.getStatistics(manga.id)

    let latest_chapter_index
    //get the latest chapter
    try{
        latest_chapter_index = `${latestchapter.title} (${latestchapter.chapter})\nhttps://mangadex.org/chapter/${latestchapter.id}`
        if(latestchapter.title === null){
            latestchapter.title = "No Chapter Name"
        }
    }catch(err){
        //set latest chapter to nan if no chapters are found
        latest_chapter_index = `No Chapters Found.`
    }

    let first_chapter_index;
    //get the latest chapter
    try{
        first_chapter_index = `${firstchapter.title} (${firstchapter.chapter})\nhttps://mangadex.org/chapter/${firstchapter.id}`
        if(firstchapter.title === null){
            firstchapter.title = "No Chapter Name"
        }
    }catch(err){
        //set first chapter to nan if no chapters are found
        first_chapter_index = `No Chapters Found.`
    }

    const embed = new EmbedBuilder()
    .setTitle(manga.title)
    .setURL(`https://mangadex.org/title/${manga.id}`)
    .setFields(
    {name: `**Manga Description:**`, value: `${manga.localizedDescription.localString}`, inline: false},
    {name: `**Content Rating:**`, value: `${manga.contentRating}`, inline: true},
    {name: `**Manga Rating:**`, value: `${stats.rating.average}`, inline: true},
    {name: `**Status:**`, value: `${manga.status}`, inline: true},
    {name: `**Tags:**`, value: `${genres.join(", ")}`, inline: true},
    {name: `\u200B`, value: `\u200B`, inline: true},
    {name: `**Available Languages:**`, value: `${manga.availableTranslatedLanguages.join(", ")}`, inline: true},
    {name: `**First Chapter:**`, value: `${first_chapter_index}`, inline: true},
    {name: `**Latest Chapter:**`, value: `${latest_chapter_index}`, inline: true})
    .setImage(lastcover.imageSource)
    .setFooter({text: `Requested by ${message.author.tag}`})

    message.channel.send({embeds: [embed]})
    }catch(err){
        message.reply(`**An issue with the api.**`)
    }
    }
    
    MFA.login(process.env.mangauser, process.env.mangapass, '../../bin/').then(async () => {
        try{

        //if args include random
        if(args.includes("-random")){
        const manga = await MFA.Manga.getRandom("safe")
        GetManga(manga)
        }else{

        let manga
        //if args don't include random
        try{
            manga = await MFA.Manga.getByQuery(`${args.join(" ")}`)
        }catch(err){
            message.reply(`**Your search provided no results.**`)
            return;
        }
        GetManga(manga)
        }
        }catch(err){
            console.log(err)
            message.reply(`**Error, please try again.**`)
        }
    })
};
exports.name = "manga";
exports.aliases = ["manga"]
exports.description = ["Returns a manga. you can search by title or get a random manga by leaving the arguments blank. do not include special characters like \`!, #, @, ^\` when you're searching by title.\n**Parameters:**\n\`-random\` gets a random manga\nPowered by [MangaDex](https://mangadex.org/)"]
exports.usage = [`manga kimetsu no yaiba`]
exports.category = ["fun"]