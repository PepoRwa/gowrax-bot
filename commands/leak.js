const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('final-leak')
        .setDescription('Simule un crash terminal suivi du leak de la Division 04.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // 1. Le faux crash VS Code (Apparaît en premier)
        const terminalCrash = `\`\`\`bash
crazzynel@mac gowrax-bot % node deploy-commands.js
[dotenv@17.3.1] injecting env (3) from .env
node:events:491
      throw er; // Unhandled 'error' event
      ^

Error [GUILD_CHANNEL_RESOLVE]: Could not resolve channel ID 'DIV_04_SECRET_INTERNAL'
    at /Users/crazzynel/Documents/gowrax-bot/commands/roster-builder.js:42:12
\`\`\``;

        // 2. Le message de Leak (Plus lisible, ancien format)
        const leakContent = `@everyone
> **[ BREACH DETECTED ] - GOWRAX INTERNAL SYSTEM**
\`\`\`
ID_SQUAD   : Division_04
CODE_KEY   : 7355608
REDIRECT   : https://gowrax.me/roster
STATUS     : Pending_Validation_CEO
INFO       : "Note: Ne pas diffuser avant le déploiement moteur."
\`\`\`
**CRITICAL_ERROR: Memory dump leaked to public_channel. Interruption...**`;

        // On envoie le crash d'abord
        await interaction.channel.send(terminalCrash);

        // Petite pause de 1.5s pour l'effet "le bot panique et leak"
        setTimeout(async () => {
            await interaction.channel.send(leakContent);
        }, 1500);

        return interaction.reply({ content: "✅ Crash et Leak envoyés.", ephemeral: true });
    }
};