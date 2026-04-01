const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check-inactif-v2')
        .setDescription("Envoie un message de vérification d'inactivité (2 Embeds Séparés).")
        .addRoleOption(option => 
            option.setName('role')
                .setDescription("Le rôle ciblé")
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const role = interaction.options.getRole('role');
        const members = role.members;

        if (members.size === 0) {
            return interaction.editReply({ content: `❌ Aucun membre ne possède le rôle ${role.name}.` });
        }

        const embedFr = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('Gowrax - Mise au point 🇫🇷')
            .setDescription(`Il y a quelques jours, certains d’entre vous ont reçu un message concernant leur volonté de poursuivre l’aventure avec nous.

Aujourd’hui, l’administration de l’équipe souhaite clarifier et renforcer les critères de participation au sein de la structure :

• **Présence & participation**
Une présence plus régulière aux entraînements collectifs est attendue afin de favoriser la progression et la cohésion d’équipe.

• **Comportement & sérieux**
Chaque membre doit adopter un comportement en accord avec les valeurs de la structure : respect, communication et sérieux.

• **Transparence sur l’implication**
Si vous savez que vous ne pourrez pas suivre le rythme demandé, merci de nous le signaler clairement afin que nous puissions adapter l’organisation.

• **En cas de manque d’implication**
Si votre participation est jugée insuffisante malgré les attentes liées à votre rôle, des mesures pourront être prises : rappel, changement de rôle ou retrait du roster compétitif si nécessaire.

Ce message a pour but de poser un cadre clair, sérieux et équitable pour tous. Nous voulons avancer avec des membres motivés, investis et alignés avec les ambitions de l’équipe.`);

        const embedEn = new EmbedBuilder()
            .setColor('#2F3136')
            .setTitle('Gowrax - Update 🇬🇧')
            .setDescription(`A few days ago, some of you received a message regarding your willingness to continue this journey with us.

Today, the team staff would like to clarify and strengthen the participation requirements within the team:

• **Presence & Participation**
More regular attendance during team practice sessions is expected in order to improve both progression and team chemistry.

• **Behavior & Seriousness**
Every member is expected to adopt behavior that reflects the team’s values: respect, communication, and seriousness.

• **Commitment Transparency**
If you know you will not be able to keep up with the expected pace, please let us know clearly so we can adjust the organization accordingly.

• **In Case of Insufficient Involvement**
If your participation is considered insufficient despite the expectations tied to your role, measures may be taken, including a warning, a role change, or removal from the competitive roster if necessary.

This message is meant to establish a clear, serious, and fair framework for everyone. We want to move forward with members who are motivated, committed, and aligned with the team’s ambitions.`)
            .setFooter({ text: "The Gowrax Administration" })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('checkinactif_continue')
                .setLabel("Continuer l'aventure / Continue")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('checkinactif_stop')
                .setLabel("M'arrêter là / Stop here")
                .setStyle(ButtonStyle.Danger)
        );

        let successCount = 0;
        let failCount = 0;

        for (const [id, member] of members) {
            try {
                await member.send({ embeds: [embedFr, embedEn], components: [row] });
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        await interaction.editReply({ content: `✅ Message de vérification envoyé.\n- Succès : **${successCount}**\n- Échecs (DMs fermés) : **${failCount}**` });
    },
};
