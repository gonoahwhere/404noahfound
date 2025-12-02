# ![toastoku](https://raw.githubusercontent.com/gonoahwhere/gonoahwhere/main/assets/images/toastoku_img.png)

<br>

<div align="center">
  <img src="https://img.shields.io/badge/Created-15th_June_2025-4259ed" alt="Created Project" />
  <img src="https://img.shields.io/badge/- JavaScript-ed4242?logo=javascript&logoColor=white&labelColor=grey" alt="Language" />
  <img src="https://img.shields.io/badge/- MongoDB-4259ed?logo=mongodb&logoColor=white&labelColor=grey" alt="MongoDB">
  <img src="https://img.shields.io/badge/- Discord Bot-ed4242?logo=discord&logoColor=white&labelColor=grey" alt="Type of App" />
</div>

<br>
<br>

### Slash Commands List

| Name | Description | Options | Permissions |
| ------------- | ------------- | ------------- | ------------- |
| `changelogs` | `View the most recent changes to Toastoku!` | `None` | `None` |
| `daily` | `Play the Daily Sudoku.` | `None` | `None` |
| `help` | `Sudoku guidance served with a side of humour.` | `None` | `None` |
| `hint` | `Fill a hint in your current Sudoku game.` | `None` | `None` |
| `leaderboard` | `View the richest users across Toastoku!` | `None` | `None` |
| `profile` | `View your bot's profile!` | `None` | `None` |
| `server-settings edit` | `Edit your server settings.` | `None` | `Manage_Guild` |
| `server-settings view` | `View your server settings.` | `None` | `None` |
| `settings edit` | `Edit your current bot settings.` | `None` | `Manage_Guild` |
| `settings view` | `View your current bot settings.` | `None` | `None` |
| `stats` | `View your last 10 Sudoku games!` | `None` | `None` |
| `sudoku play` | `Play a new Sudoku game.` | `difficulty`, `theme`, `mode` | `None` |
| `topgg` | `Post bot stats to Top.GG` | `None` | `Bot Owner` |
| `weekly-quests` | `View this week's quests!` | `None` | `None` |

<br>

### Features
- 🎮 **Modes**: $$\color{#ffc577} \small \mathsf{\text{Complete puzzles by yourself or with friends in real-time Sudoku games.}}$$
- 🎨 **Themes**: $$\color{#ffc577} \small \mathsf{\text{Play with numbers or any 1 of the 5 emoji themes.}}$$
- ✏️ **Notes**: $$\color{#ffc577} \small \mathsf{\text{Keep forgetting which numbers possibly go where? I got you covered!}}$$
- 💡 **Smart Hints**: $$\color{#ffc577} \small \mathsf{\text{Use hints to fill in a correct number when you’re stuck.}}$$
- 🏆 **Daily Challenges**: $$\color{#ffc577} \small \mathsf{\text{New puzzles every day with varying difficulty levels and rewards.}}$$
- 📅 **Weekly Quests**: $$\color{#ffc577} \small \mathsf{\text{Can you finish this weeks quest on time?}}$$
- 💰 **Economy System**: $$\color{#ffc577} \small \mathsf{\text{Earn toasts by completing puzzles and more.}}$$
- 🏅 **Leaderboards**: $$\color{#ffc577} \small \mathsf{\text{Track player progress and crown the Sudoku champion in your Discord server!}}$$
- 👤 **Profiles**: $$\color{#ffc577} \small \mathsf{\text{Manage your bot profile, providing you with anonimity.}}$$
- 📊 **Stats**: $$\color{#ffc577} \small \mathsf{\text{Want to show off your latest victory? Now you can!}}$$
- 📖 **Instructions**: $$\color{#ffc577} \small \mathsf{\text{Not sure where to start? Check out the in-depth instruction manual!}}$$

<br>

> [!NOTE]
> Hints need to be enabled in the server before you can use them, they decrease from daily count first then bonus. <br>
> If you have no hints then it wont let you use one!

<br>

### Setting Up
- #### Installing Node.JS & NPM Packages
  - **Node.JS**:
    - $$\color{#ffc577} \small \mathsf{\text{To download Node.JS, head over to \color{white}nodejs.org \color{#ffc577}.}}$$
    - $$\color{#ffc577} \small \mathsf{\text{Download the \color{white}LTS (Long Term Support) \color{#ffc577}version.}}$$
    - $$\color{#ffc577} \small \mathsf{\text{Once downloaded, run the installer and follow the instructions on screen.}}$$
    - $$\color{#ffc577} \small \mathsf{\text{You can verify that you've installed it properly by using \color{white}node --version \color{#ffc577}and \color{white}npm --version \color{#ffc577}in the terminal.}}$$
  - **NPM**:
    - ⚙️ `npm install <package name>` - $$\color{#ffc577} \small \mathsf{\text{To install the packages that the bot requires.}}$$
    - ⚙️ `npm update <package name>` - $$\color{#ffc577} \small \mathsf{\text{To update the packages that the bot requires.}}$$
    - ⚙️ `npm uninstall <package name>` - $$\color{#ffc577} \small \mathsf{\text{To remove a package from the bot.}}$$

<br>

| Package | Install Command | Current Version | Latest Version |
| ------------- | ------------- | ------------- | ------------- |
| `@top-gg/sdk` | `npm i @top-gg/sdk` | `3.1.6` | `3.1.6` |
| `bignumber.js` | `npm i bignumber.js` | `9.3.1` | `9.3.1` |
| `canvas` | `npm i canvas@3.0.1` | `3.0.1` | `3.2.0` |
| `common-tags` | `npm i common-tags` | `1.8.2` | `1.8.2` |
| `dis-warden` | `npm i dis-warden@1.0.0` | `1.0.0` | `1.1.0-beta.0` |
| `discord.js` | `npm i discord.js@14.19.3` | `14.19.3` | `14.24.2` |
| `dotenv` | `npm i dotenv@16.5.0` | `16.5.0` | `17.2.3` |
| `fluident` | `npm i fluident@1.0.0` | `1.0.0` | `1.0.2` |
| `gamertag-forge` | `npm i gamertag-forge` | `1.0.1` | `1.0.1` |
| `mongoose` | `npm i mongoose` | `8.15.2` | `8.19.3` |
| `sudoku` | `npm i sudoku` | `0.0.3` | `0.0.3` |
| `xp-flow` | `npm i xp-flow` | `2.1.0-STABLE` | `2.1.0-STABLE` |

<br>

> [!NOTE]
> Current Version is the version I have been using, and know will work fine. <br>
> Latest Version is the latest version as of writing this.

<br> 

- #### Creating a Project
  - $$\color{#ffc577} \small \mathsf{\text{Once Node.JS and a text editor of your choice installed, create a file for your project and open in the text editor.}}$$
  - ⚙️ `npm init -y` - $$\color{#ffc577} \small \mathsf{\text{This will create the \color{white}package.json \color{#ffc577}file which is needed for installing packages with npm.}}$$
  - $$\color{#ffc577} \small \mathsf{\text{Afterwards, install all of the above packages so that none of the files throw an error.}}$$

<br> 

- #### Starting the Bot & Deploying Commands
  - ⚙️ `node index.js` - $$\color{#ffc577} \small \mathsf{\text{To get the bot up and running.}}$$
  - ⚙️ `node guildDeploy.js` - $$\color{#ffc577} \small \mathsf{\text{To change or add new commands to your test guild (after creating them).}}$$
  - ⚙️ `node globalDeploy.js` - $$\color{#ffc577} \small \mathsf{\text{To change or add new commands globally (after creating them).}}$$
  - 📄 `.env`: $$\color{#ffc577} \small \mathsf{\text{Private information gets stored in here, like bot tokens (don't share tokens with anybody).}}$$
    - `DISCORD_BOT_TOKEN` - $$\color{#ffc577} \small \mathsf{\text{This is the token used to bring your bot online.}}$$
    - `DISCORD_CLIENT_ID` - $$\color{#ffc577} \small \mathsf{\text{This is the user id for your bot.}}$$
    - `TEST_GUILD_ID` - $$\color{#ffc577} \small \mathsf{\text{This is the id for your test guild.}}$$
    - `MongoURI` - $$\color{#ffc577} \small \mathsf{\text{This is your login credentials for your Mongoose Cluster/Collection (delete if using another database).}}$$
    - `TOPGG_TOKEN` - $$\color{#ffc577} \small \mathsf{\text{This is the token for your Top.GG bot/server (delete if bot/server isn't on Top.GG).}}$$

<br>

> [!NOTE]
> Use guild commands to test as they appear instantly, global commands take up to 1 hour to appear on Discord.

<br>

- #### Updating Bot Information
  - 📄 `config.js`: $$\color{#ffc577} \small \mathsf{\text{Bot information is stored in here.}}$$
    - `botid`: $$\color{#ffc577} \small \mathsf{\text{This is your bots ID (right click on your bot -> copy user id).}}$$
    - `settings`:
      - `prefix` - $$\color{#ffc577} \small \mathsf{\text{This is the prefix that your bot uses.}}$$
      - `ver` - $$\color{#ffc577} \small \mathsf{\text{This is the version that your bot is currently on.}}$$
      - `dob` - $$\color{#ffc577} \small \mathsf{\text{This is the date you made your bot.}}$$
    - `owner`:
      - `tag` - $$\color{#ffc577} \small \mathsf{\text{This is your discord username.}}$$
      - `id` - $$\color{#ffc577} \small \mathsf{\text{This is your discord ID (right click on yourself -> copy user id).}}$$
      - `mention` - $$\color{#ffc577} \small \mathsf{\text{This is to display as a mention \color{white}<@!\<your id\>\color{#ffc577}.}}$$
    - `embed`:
      - `embedFooter` - $$\color{#ffc577} \small \mathsf{\text{This is the message displayed at the bottom of your embeds.}}$$
      - `embedColor` - $$\color{#ffc577} \small \mathsf{\text{This is the colour on the side of your embeds.}}$$
    - `devs`:
      -  `noah` - $$\color{#ffc577} \small \mathsf{\text{You can list all of your developers here, just change \color{white}noah \color{#ffc577}and \color{white}<@!372456601266683914> \color{#ffc577}with their name/mention.}}$$

<br>

### Directory
- 📁 **bot**: $$\color{#ffc577} \small \mathsf{\text{Contains almost all bot files.}}$$
  - 📁 **assets**: $$\color{#ffc577} \small \mathsf{\text{Contains all static resources.}}$$
    - 📁 **emoji-sets**: $$\color{#ffc577} \small \mathsf{\text{Emoji themes for Sudoku.}}$$
      - 📁 **animals**: $$\color{#ffc577} \small \mathsf{\text{Animal Icons.}}$$
      - 📁 **colorblind**: $$\color{#ffc577} \small \mathsf{\text{Accessible version of Toastie Icons.}}$$
      - 📁 **faces**: $$\color{#ffc577} \small \mathsf{\text{Face Icons.}}$$
      - 📁 **toastie**: $$\color{#ffc577} \small \mathsf{\text{Toast Icons.}}$$
      - 📁 **transport**: $$\color{#ffc577} \small \mathsf{\text{Transport Icons.}}$$
  - 📁 **commands**: $$\color{#ffc577} \small \mathsf{\text{Contains all slash command definitions.}}$$
    - 📁 **global**: $$\color{#ffc577} \small \mathsf{\text{Commands files to register across all servers.}}$$
  - 📁 **events**: $$\color{#ffc577} \small \mathsf{\text{Handles Discord interactions and events.}}$$
    - 📁 **buttons**: $$\color{#ffc577} \small \mathsf{\text{Button related logic.}}$$
    - 📁 **client**: $$\color{#ffc577} \small \mathsf{\text{client related logic.}}$$
    - 📁 **menus**: $$\color{#ffc577} \small \mathsf{\text{Menu related logic.}}$$
  - 📁 **fonts**: $$\color{#ffc577} \small \mathsf{\text{Custom typefaces used for rendering default theme.}}$$
  - 📁 **jsons**: $$\color{#ffc577} \small \mathsf{\text{JSON files for Sudoku commands.}}$$
- 📁 **handlers**: $$\color{#ffc577} \small \mathsf{\text{Handles linking and loading files.}}$$
- 📁 **models**: $$\color{#ffc577} \small \mathsf{\text{Mongoose schemas for Sudoku saving logic.}}$$
- 📁 **utils**: $$\color{#ffc577} \small \mathsf{\text{Handles utility features for Sudoku games.}}$$
- 📄 `cleanOldCompletions.js`: $$\color{#ffc577} \small \mathsf{\text{Handles cleaning up of old daily completions from database.}}$$
- 📄 `config.js` - $$\color{#ffc577} \small \mathsf{\text{Stores information about the bot.}}$$
- 📄 `dailyHintsReset.js`: $$\color{#ffc577} \small \mathsf{\text{Handles resetting daily hints each day.}}$$
- 📄 `globalDeploy.js`: $$\color{#ffc577} \small \mathsf{\text{Handles registering commands to all servers.}}$$
- 📄 `guildDeploy.js`: $$\color{#ffc577} \small \mathsf{\text{Handles registering commands to test guild.}}$$
- 📄 `index.js`: $$\color{#ffc577} \small \mathsf{\text{Main bot file where everything is linked together.}}$$

<br>

> [!NOTE]
> You will need to go through the command files and change the emoji strings to your own.
> Make sure to add the images you want to use to your server (or the emojis section in the Developer Portal)

<br> 
