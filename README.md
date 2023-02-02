# MIA

Mia is a simple discord osu! bot

invite the bot to your server using [this link](https://discord.com/api/oauth2/authorize?client_id=995999045157916763&permissions=1099646134598&scope=bot)

## Hosting the bot

If you want to host the bot on your computer, follow these steps: (might be outdated)

-Make a new osu! OAuth application [here](https://osu.ppy.sh/home/account/edit#new-oauth-application)

-Go to `.env_sample` and rename the file to `.env`

-Go into the file and Paste your discord token to `TOKEN_HERE`, and your osu! Client ID and Client Secret to `clientidhere` and `clientsecrethere`. now you'll need to put your osu! username and password to `userd` and `pass`.

-Make two files named `prefixes.json`, `user-data.json` and two folders named `beatmapsongs` and `extracted` (if they don't exist) in the root directory.

## How to run the bot

Open the command prompt, navigate to the folder and type "npm install". This will install the node modules that are essential for the bot to run.

After they're finished installing, type `node .` to run the bot or simply run the `run.bat` file.

## Contact me

if you have any questions or just want to have someone to talk to, add me on discord (yoru#9267), or message me on twitter (@ken_yoru)

## Dependencies

[osu-api-extended](https://github.com/cyperdark/osu-api-extended)

[osu-pp-calculator](https://github.com/kionell/osu-pp-calculator)
