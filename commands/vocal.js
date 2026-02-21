const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vocal')
        .setDescription('Gère ton salon vocal temporaire.')
        .addSubcommand(sub => 
            sub.setName('limite')
               .setDescription('Définit une limite de places.')
               .addIntegerOption(opt => opt.setName('nombre').setDescription('Nombre de places (0 pour illimité)').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('nom')
               .setDescription('Renomme ton salon.')
               .addStringOption(opt => opt.setName('titre').setDescription('Nouveau nom').setRequired(true))
        ),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        const CATEGORY_ID = 'ID_TA_CATEGORIE_VOCAUX';

        // Sécurité : Vérifier si l'utilisateur est bien dans son propre vocal temporaire
        if (!voiceChannel || voiceChannel.parentId !== CATEGORY_ID) {
            return interaction.reply({ content: "❌ Tu dois être dans ton salon vocal temporaire pour faire ça.", ephemeral: true });
        }

        // Vérifier si c'est bien son salon (on peut check les permissions)
        if (!voiceChannel.permissionsFor(interaction.member).has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: "❌ Tu n'es pas le propriétaire de ce salon.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'limite') {
            const limit = interaction.options.getInteger('nombre');
            await voiceChannel.setUserLimit(limit);
            return interaction.reply({ content: `✅ Limite fixée à ${limit} places.`, ephemeral: true });
        }

        if (sub === 'nom') {
            const titre = interaction.options.getString('titre');
            await voiceChannel.setName(`🔊 ${titre}`);
            return interaction.reply({ content: `✅ Salon renommé en : **${titre}**.`, ephemeral: true });
        }
    },
};