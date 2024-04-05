# Contributing

To start contributing, you either need to install [Bun](https://bun.sh/)

1. Install Bun using curl
   - `curl -fsSL https://bun.sh/install | bash`
   or if you're on Windows:
   - `powershell -c "irm bun.sh/install.ps1 | iex"`

2. Install npm.

3. Clone the repository.
   - `git clone https://github.com/yorunoken/hanamibot`

4. Navigate inside the directory and install the dev, and normal dependencies.
   - `cd hanamibot && npm install -D`

5. Install ESLint as an extension in your IDE to help with types.

6. Fill out `.env.local` with your API keys (see below to see how).

7. You can use `bun start` to start the bot and test your code.

## Getting API keys

You need to fill `.env.local` with the approriate API keys to make the bot work. Here's how:

### DISCORD_BOT_TOKEN (your bot's token)

   1. Go to [Discord's developer portal](https://discord.com/developers/applications) and create a new application.

   2. Navigate to the `Bot` tab, seen on the left.

   3. Reset its token and get the new one.

   4. You should also enable all 3 of the privilaged intents for the bot to function.

### ACCESS_TOKEN (osu! key to make leaderboard commands function)

   1. Go to [osu!s home page](https://osu.ppy.sh/home) and press f12 to open up the developer page.

   2. Navigate to the `Storage` tab. If you don't see it, click on the arrow and reveal the dropout box.

   3. Inside `Storage` tab, click on `cookies` and `https://osu.ppy.sh`

   4. Search for an item named `osu_session`

   5. Copy its value, that's your `OSU_SESSION` key.

### CLIENT_SECRET and CLIENT_ID (osu! Auth)

   1. Go to [osu! account settings](https://osu.ppy.sh/home/account/edit) and scroll until you see `OAuth` section.

   2. Create a new OAuth application, give it a name (you can leave Callback URL part blank) and register it.

   3. Edit your newly made application.

   4. Copy its Client ID and Client secret and you're good to go.

### CALLBACK_URL (callback URL for /link command)

   This one is a little tricky, because you will need to host a website.

1. Hosting websites are free using [Vercel](https://vercel.com).

2. Create a new project in the free hosting platform, [Vercel](https://vercel.com) and select the `Import Third-Party Git Repository` option.

3. Input my template repo <https://github.com/YoruNoKen/hanamiVerifier> and build the website.

4. Copy the URL, add it to `Application Callback URLs` in your osu! Application and your .env.local file.
