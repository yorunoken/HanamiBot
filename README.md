# Hanami 🌸

Hanami is a simple osu! bot written in discordjs-v14!

Invite the bot to your server using [this link](https://discord.com/api/oauth2/authorize?client_id=995999045157916763&permissions=330752&scope=bot)

## Commands ⭐

`/osu` get a user's osu! profile

`/recent` get a user's most recent osu! score

`/top` get a user's osu! top plays

use `/help` in your server for more information.

## Contributing

To start contributing, you either need to be on a UNIX operating system (Linux, MacOS, etc.) or you need to use [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) (Windows Subsystem for Linux) to instal [Bun](https://bun.sh/)

1. Install Bun using curl
   - `curl -fsSL https://bun.sh/install | bash`

2. Install npm.

3. Clone the repository.
   - `git clone https://github.com/yorunoken/hanamibot`

4. Navigate inside the directory and install the dev, and normal dependencies.
   - `cd hanamibot && npm install -D`

5. Install ESLint as an extension in your IDE to help with types.

6. Fill out `.env.local.example` with your API keys (see below to see how) and delete the `.example` off of it.

7. You can use `bun start` to start the bot and test your code.

## Getting API keys

You need to fill `.env.local` with the approriate API keys to make the bot work. Here's how:

1. TOKEN (your bot's token):

   - Go to [Discord's developer portal](https://discord.com/developers/applications) and create a new application.

   - Navigate to the `Bot` tab, seen on the left.

   - Reset its token and get the new one.

   - You should also enable all 3 of the privilaged intents for the bot to function.

2. OSU_SESSION (osu! key to make leaderboard commands function):

   - Go to [osu!s home page](https://osu.ppy.sh/home) and press f12 to open up developer page.

   - Navigate to the `Storage` tab. If you don't see it, click on the arrow and reveal the dropout box.

   - Inside `Storage` tab, click on `cookies` and `https://osu.ppy.sh`

   - Search for an item named `osu_session`

   - Copy its value, that's your `OSU_SESSION` key.

3. CLIENT_SECRET and CLIENT_ID (osu! Auth):

   - Go to [osu! account settings](https://osu.ppy.sh/home/account/edit) and scroll until you see `OAuth` section.

   - Create a new OAuth application, give it a name (you can leave Callback URL part blank) and register it.

   - Edit your newly made application.

   - Copy its Client ID and Client secret and you're good to go.

4. OSU_DAILY_API (API for a lot of commands):

   - Go to [osu!daily API page](https://osudaily.net/api.php)

   - Log into the website and create a new API key

5. DEV_SERVERID, DEV_CHANNELID, OWNER_DISCORDID, and ERRORS_CHANNELID:

   - DEV_SERVERID:

     - The server ID of your dev server

   - DEV_CHANNELID:

     - The channel ID of where the messages from `/feedback` are sent

   - OWNER_DISCORDID:

     - Discord user ID of yourself.

   - ERRORS_CHANNELID:
     - The channel ID where error messages are sent to

## Contact me 🤙

if you have any questions or just want to have someone to talk to, add me on discord (@yorunoken), or message me on twitter (@ken_yoru)
