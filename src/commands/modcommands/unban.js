"use strict";

// ========================= //
// = Copyright (c) NullDev = //
// ========================= //

// Utils
let config = require("../../utils/configHandler").getConfig();

/**
 * Unbans a given user
 *
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Message} message
 * @param {Array} args
 * @param {Function} callback
 * @returns {Function} callback
 */
exports.run = (client, message, args, callback) => {
    let mentioned = message.mentions?.users?.first?.();

    if (!mentioned) return callback(`Da ist kein username... Mach \`${config.bot_settings.prefix.mod_prefix}unban \@username\``);

    let mentionedUserObject = message.guild.member(mentioned);

    if (mentionedUserObject.roles.cache.some(r => r.name === config.ids.default_role)) return callback("Dieser User ist nicht gebannt du kek.");

    let defaultRole = message.guild.roles.cache.find(role => role.name === config.ids.default_role);
    let bannedRole = message.guild.roles.cache.find(role => role.name === config.ids.banned_role);

    if (!defaultRole || !bannedRole) return callback("Eine der angegebenen Rollen für das bannen existiert nich.");

    mentionedUserObject.roles.add(defaultRole);
    mentionedUserObject.roles.remove(bannedRole);

    if (mentionedUserObject.roles.cache.find(r => r.name === "B&-Gründerväter")){
        mentionedUserObject.roles.remove(message.guild.roles.cache.find(role => role.name === "B&-Gründerväter"));
        mentionedUserObject.roles.add(message.guild.roles.cache.find(role => role.name === "Gründerväter"));
    }

    if (mentionedUserObject.roles.cache.find(r => r.name === "B&-Trusted")){
        mentionedUserObject.roles.remove(message.guild.roles.cache.find(role => role.name === "B&-Trusted"));
        mentionedUserObject.roles.add(message.guild.roles.cache.find(role => role.name === "Trusted"));
    }

    message.channel.send(`User ${mentionedUserObject} wurde entbannt!`);
    message.guild.member(mentioned).send("Glückwunsch! Du wurdest von der Coding Shitpost Zentrale entbannt. Und jetzt benimm dich.");

    return callback();
};

exports.description = `Entbannt einen User indem er die ${config.ids.banned_role} Rolle wegnimmt.\nBenutzung: ${config.bot_settings.prefix.mod_prefix}unban username`;
