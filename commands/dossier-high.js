const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dossier-high')
        .setDescription('Envoie le formulaire pour le High Roster à un joueur en DM.')
        .addUserOption(option => 
            option.setName('joueur')
                .setDescription('Le joueur à qui envoyer le formulaire')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('langue')
                .setDescription('La langue du formulaire (Français / Anglais)')
                .setRequired(true)
                .addChoices(
                    { name: 'Français', value: 'fr' },
                    { name: 'Anglais', value: 'en' }
                )),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('joueur');
        const lang = interaction.options.getString('langue');

        let embed;
        if (lang === 'fr') {
            embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('📝 Formulaire High Roster')
                .setDescription(`Bonjour ${targetUser},\n\nVoici le formulaire à remplir pour ton dossier **High Roster** (qui sera publié sur le site web).\n\n🔗 **[Clique ici pour accéder au Google Form](https://forms.gle/votre_lien_fr_ici)**\n\n📸 **Important** : Si tu as une image/photo/création à nous communiquer pour ton profil, merci de l'envoyer en message privé à **nakano_san** !`)
                .setFooter({ text: "L'équipe Gowrax" });
        } else {
            embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('📝 High Roster Form')
                .setDescription(`Hello ${targetUser},\n\nHere is the form to fill out for your **High Roster** profile (which will be published on the website).\n\n🔗 **[Click here to access the Google Form](https://forms.gle/votre_lien_en_ici)**\n\n📸 **Important**: If you have an image/photo/artwork for your profile, please send it via direct message to **nakano_san**!`)
                .setFooter({ text: 'The Gowrax Team' });
        }

        try {
            await targetUser.send({ embeds: [embed] });
            await interaction.reply({ content: `✅ Le formulaire a bien été envoyé en DM à ${targetUser}.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: `❌ Impossible d'envoyer un message privé à ${targetUser}. Leurs DMs sont peut-être fermés.`, ephemeral: true });
        }
    },
};
