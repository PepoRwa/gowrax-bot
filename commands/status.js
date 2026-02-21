const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Modifie l\'état affiché des services GOWRAX.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('etat')
                .setDescription('L\'état actuel')
                .setRequired(true)
                .addChoices(
                    { name: '🟢 Opérationnel', value: 'online' },
                    { name: '🟡 Perturbé / Dev', value: 'dev' },
                    { name: '🔴 Maintenance', value: 'maintenance' }
                )),

    async execute(interaction) {
        const choice = interaction.options.getString('etat');
        const STATUS_CHANNEL_ID = '1474203660568363176';
        const channel = await interaction.guild.channels.fetch(STATUS_CHANNEL_ID);
        
        let config = {
            title: '🟢 Opérationnel',
            color: '#2ECC71',
            emoji: '🟢',
            desc: 'Tous les systèmes sont actuellement **en ligne**. Les services ci-dessous sont opérationnels.'
        };

        if (choice === 'dev') {
            config = { title: '🟡 Perturbé / Dev', color: '#F1C40F', emoji: '🟡', desc: 'Le bot est en phase de **développement**. Certains services peuvent être instables.' };
        } else if (choice === 'maintenance') {
            config = { title: '🔴 Maintenance', color: '#E74C3C', emoji: '🔴', desc: 'Le bot est en **maintenance**. La plupart des services sont suspendus.' };
        }

        const embed = new EmbedBuilder()
            .setTitle('📡 GOWRAX - État des Services')
            .setColor(config.color)
            .setDescription(config.desc)
            .addFields(
                { name: '🤖 Bot Status', value: config.title, inline: true },
                { name: '🛠️ Mode', value: choice === 'dev' ? 'Développement' : 'Standard', inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '📋 Détails des Services', value: 
                    `${config.emoji} **Chat Vocal**\n` +
                    `${config.emoji} **Tickets**\n` +
                    `${config.emoji} **Statuts**\n` +
                    `${config.emoji} **Modération**\n` +
                    `${config.emoji} **Rôles notifications**` 
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Mise à jour manuelle par Staff' });

        const messages = await channel.messages.fetch({ limit: 10 });
        const lastStatus = messages.find(m => m.author.id === interaction.client.user.id && m.embeds[0]?.title === '📡 GOWRAX - État des Services');

        if (lastStatus) await lastStatus.edit({ embeds: [embed] });
        else await channel.send({ embeds: [embed] });

        return interaction.reply({ content: `✅ Statut mis à jour sur ${config.title}`, ephemeral: true });
    }
};