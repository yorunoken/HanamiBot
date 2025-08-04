# Contributing

To start contributing, you need to install [Bun](https://bun.sh/)

1. Install Bun using curl
    - `curl -fsSL https://bun.sh/install | bash`
      or if you're on Windows:
    - `powershell -c "irm bun.sh/install.ps1 | iex"`

2. Clone the repository.
    - `git clone https://github.com/yorunoken/hanamibot`

3. Navigate inside the directory and install the dev, and normal dependencies.
    - `cd HanamiBot && bun install`

4. Install ESLint and Prettier as an extension in your IDE to help with types and formatting.

5. Fill out `.env.local` with your API keys (see below to see how).

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

4. Copy its Client ID and Client secret, paste them into the env file and you're good to go.

### CALLBACK_URL (callback URL for /link command)

This one is a little tricky, because you will need to host a website.

1. Hosting websites is free using [Vercel](https://vercel.com).

2. Create a new project in the free hosting platform, [Vercel](https://vercel.com) and select the `Import Third-Party Git Repository` option.

3. Input my template repo <https://github.com/YoruNoKen/hanamiVerifier> and build the website.

4. Copy the URL, add it to `Application Callback URLs` in your osu! Application and your .env.local file.

### ERROR_CHANNEL_ID (Optional - for error logging)

1. Create a Discord server for development/testing if you don't have one.

2. Create a text channel specifically for error logs (e.g., `#error-logs`).

3. Right-click on the channel and select `Copy Channel ID` (you may need to enable Developer Mode in Discord settings first).

4. Paste the channel ID as the value for `ERROR_CHANNEL_ID`.

### OWNER_ID (Your Discord user ID)

1. In Discord, right-click on your username/avatar and select `Copy User ID` (Developer Mode must be enabled).

2. Paste your user ID as the value for `OWNER_ID`.

### DEV (Development mode)

Set this to `1` to enable development mode, or `0` for production. For local development, keep it as `1`.

### Redis Configuration

This project uses Redis to remember button message data even after the bot was restarted:

1. Install Redis on your system:
    - **Linux/macOS**: `sudo apt install redis-server` or `brew install redis`
    - **Windows**: Download from [Redis for Windows](https://github.com/microsoftarchive/redis/releases)

2. Start the Redis server:
    - **Linux/macOS**: `redis-server`
    - **Windows**: Run the Redis server executable

3. The default configuration should work:
    - `REDIS_HOST=localhost`
    - `REDIS_PORT=6379`
    - `REDIS_PASSWORD=very_secure_password` (change this to a secure password)
    - `REDIS_DB=0`

## Running the Bot

After setting up all the environment variables:

1. Copy `.env.example` to `.env.local`:

    ```bash
    cp .env.example .env.local
    ```

2. Fill in all the required values in `.env.local` according to the sections above.

3. Register the bot's slash commands:

    ```bash
    bun run register-commands.ts
    ```

4. Start the bot:
    ```bash
    bun start
    ```

## Development Guidelines

- Use ESLint and Prettier for code formatting
- Follow the existing code structure and patterns
- Test your changes thoroughly before submitting a pull request
- Make sure all environment variables are properly configured
