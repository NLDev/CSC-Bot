"use strict";

// ========================= //
// = Copyright (c) NullDev = //
// ========================= //

/** @typedef {import("discord.js").TextChannel} TC */

// Dependencies
let Discord = require("discord.js");
let cron = require("node-cron");

// Utils
let conf = require("./utils/configHandler");
let log = require("./utils/logger");

// Handler
let messageHandler = require("./handler/messageHandler");
let reactionHandler = require("./handler/reactionHandler");
let BdayHandler = require("./handler/bdayHandler");
let fadingMessageHandler = require("./handler/fadingMessageHandler");
let storage = require("./storage/storage");

// Other commands
let ban = require("./commands/modcommands/ban");
let poll = require("./commands/poll");

let version = conf.getVersion();
let appname = conf.getName();
let devname = conf.getAuthor();

let splashPadding = 12 + appname.length + version.toString().length;

console.log(
    `\n #${"-".repeat(splashPadding)}#\n` +
    ` # Started ${appname} v${version} #\n` +
    ` #${"-".repeat(splashPadding)}#\n\n` +
    ` Copyright (c) ${(new Date()).getFullYear()} ${devname}\n`
);

log.done("Started.");

const config = conf.getConfig();
const client = new Discord.Client();

// @ts-ignore
process.on("unhandledRejection", (err, promise) => log.error(`Unhandled rejection (promise: ${promise}, reason: ${err.stack})`));

let firstRun = true;
client.on("ready", async() => {
    log.info("Running...");
    log.info(`Got ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds`);
    client.user.setActivity(config.bot_settings.status);

    const bday = new BdayHandler(client);
    if (firstRun){
        await storage.initialize();
        firstRun = false; // Hacky deadlock ...
        let csz = client.guilds.cache.get(config.ids.guild_id);

        cron.schedule("37 13 * * *", () => {
            /** @type {TC} */
            (csz.channels.cache.get(config.ids.hauptchat_id)).send("Es ist `13:37` meine Kerle.\nBleibt hydriert! :grin: :sweat_drops:");

            // Auto-Prune members
            csz.members.prune({ days: 2, reason: "auto prune" })
                .then(count => {
                    log.info(`Auto-prune: ${count} members pruned.`);
                    if (count >= 1){
                        /** @type {TC} */
                        (csz.channels.cache.get(config.ids.hauptchat_id)).send(`Hab grad ${count} jockel weg-gepruned :joy:`);
                    }
                }).catch(e => log.error(e));
        });

        cron.schedule("1 0 * * *", () => bday.checkBdays());
        bday.checkBdays();
    }

    ban.loadBans();
    ban.startCron(client);

    await poll.importPolls();
    poll.startCron(client);

    /** @type {import("discord.js").TextChannel} */
    const supportChannel = await client.channels.fetch(config.ids.support_channel_id);
    // Check if channel is empty to create support message
    console.log(supportChannel.lastMessageID);
    if(supportChannel && !(supportChannel.lastMessageID)) {
        supportChannel.send({
            embed: {
                title: "CSZ Support",
                color: 0x1f8b4c,
                description: "Hallo mein Name ist Ranjid, wenn du ein Problem hast, dann zieh hier unten an meinem Ding ein Ticket, ich werde dir schnellstmöglichst mit deinem Anliegen helfen.",
                author: {
                    name: "Ranjid Rajesh Motlokoguruparan",
                    icon_url: "attachment://ranjid.jpg"
                },
                thumbnail: {
                    url: "attachment://ranjid.jpg"
                }
            },
            files: ["./assets/ranjid.jpg"]
        }).then(message => message.react("🎫"));
    }

    fadingMessageHandler.startLoop(client);
});

client.on("guildCreate", guild => log.info(`New guild joined: ${guild.name} (id: ${guild.id}) with ${guild.memberCount} members`));

client.on("guildDelete", guild => log.info(`Deleted from guild: ${guild.name} (id: ${guild.id}).`));

client.on("message", (message) => messageHandler(message, client));

client.on("error", log.error);

client.on("raw", async event => reactionHandler(event, client));

client.login(config.auth.bot_token).then(() => {
    log.done("Token login was successful!");
}, (err) => {
    log.error(`Token login was not successful: "${err}"`);
    log.error("Shutting down due to incorrect token...\n\n");
    process.exit(1);
});
