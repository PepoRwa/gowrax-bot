const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-live')
        .setDescription('📡 Simule une alerte Twitch pour tester le design.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const CHANNEL_ID = '1473308632564236411'; 
        const ROLE_NOTIF_ID = '1472735339796889784';
        const twitchUrl = 'https://twitch.tv/twitch';
        
        const channel = interaction.guild.channels.cache.get(CHANNEL_ID);
        if (!channel) return interaction.reply({ content: "❌ Salon introuvable.", ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#6441A5')
            .setTitle(`🎮 [TEST] : ${interaction.user.username} est en direct !`)
            .setURL(twitchUrl)
            .setDescription(`**Titre :** CECI EST UN TEST DE NOTIFICATION\n**Jeu :** Just Chatting`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_twitch-1920x1080.jpg`)
            .setFooter({ text: 'GOWRAX Live System • Test Mode' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Aller voir le live')
                    .setURL(twitchUrl)
                    .setStyle(ButtonStyle.Link),
            );

        await channel.send({ 
            content: `🔴 Hello <@&${ROLE_NOTIF_ID}> ! **${interaction.user.username}** lance son live ! (Simulation)`, 
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({ content: "✅ Alerte de test envoyée !", ephemeral: true });
    },
};