const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roster')
        .setDescription('Gère les rosters GOWRAX.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('afficher')
            .setDescription('Affiche le panel d’un jeu ou la présentation globale')
            .addStringOption(opt => opt.setName('jeu').setDescription('Jeu').setRequired(true).addChoices(
                {name: 'Valorant', value: 'valorant'},
                {name: 'Fortnite', value: 'fortnite'},
                {name: 'Rocket League', value: 'rl'},
                {name: '✨ Présentation Globale (All)', value: 'all'}
            )))
        .addSubcommand(sub => sub
            .setName('modifier')
            .setDescription('Ajoute des joueurs à un roster (auto-update)')
            .addStringOption(opt => opt.setName('jeu').setDescription('Jeu').setRequired(true).addChoices(
                {name: 'Valorant', value: 'valorant'}, {name: 'Fortnite', value: 'fortnite'}, {name: 'Rocket League', value: 'rl'}
            ))
            .addStringOption(opt => opt.setName('categorie').setDescription('Catégorie').setRequired(true).addChoices(
                {name: 'Coach', value: 'coach'}, {name: 'High Roster', value: 'high'}, {name: 'Tryhardeur', value: 'tryhard'}, {name: 'Academy', value: 'academy'}, {name: 'Chill', value: 'chill'}
            ))
            .addStringOption(opt => opt.setName('joueurs').setDescription('Noms ou Mentions (séparés par une virgule)').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('clear')
            .setDescription('Vider une catégorie spécifique')
            .addStringOption(opt => opt.setName('jeu').setDescription('Jeu').setRequired(true).addChoices(
                {name: 'Valorant', value: 'valorant'}, {name: 'Fortnite', value: 'fortnite'}, {name: 'Rocket League', value: 'rl'}
            ))
            .addStringOption(opt => opt.setName('categorie').setDescription('Catégorie à vider').setRequired(true).addChoices(
                {name: 'Coach', value: 'coach'}, {name: 'High Roster', value: 'high'}, {name: 'Tryhardeur', value: 'tryhard'}, {name: 'Academy', value: 'academy'}, {name: 'Chill', value: 'chill'}
            ))),

    async execute(interaction) {
        // 1. ON DIT À DISCORD DE PATIENTER
        await interaction.deferReply({ ephemeral: true });
        const jeu = interaction.options.getString('jeu');
        const sub = interaction.options.getSubcommand();

        const config = {
            valorant: { title: 'VALORANT', color: '#FF4654', img: 'https://www.riotgames.com/darkroom/1200/1dbd7211e78ce5faa7a8af9d10afad47:2b5979e3922758399ba389561e797919/ps-f2p-val-console-launch-16x9.jpg' },
            fortnite: { title: 'FORTNITE', color: '#29B6FF', img: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Fortnite_F_lettermark_logo.png' },
            rl: { title: 'ROCKET LEAGUE', color: '#FFFFFF', img: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Rocket_League_coverart.jpg' }
        };

        const formatList = (arr) => {
            if (!arr || arr.length === 0) return '`En recrutement`';
            return arr.map(j => `🔹 ${j}`).join('\n');
        };

        // --- LOGIQUE AFFICHER ---
        if (sub === 'afficher') {
            if (jeu === 'all') {
                // Utilisation du GIF Local
                const file = new AttachmentBuilder(path.join(__dirname, '../assets/presentation.gif'));

                const introEmbed = new EmbedBuilder()
                    .setTitle('🐺 GOWRAX E-SPORT | LA MEUTE S\'AGRANDIT')
                    .setColor('#FFD700')
                    .setDescription(
                        "Bienvenue au cœur de la structure **GOWRAX**. Plus qu'une team, nous bâtissons une meute unie par la gagne et la discipline.\n\n" +
                        "🚀 **NOS OBJECTIFS :**\n" +
                        "• **VALORANT** : Intégration du circuit **VCT** (Challengers/Game Changers).\n" +
                        "• **FORTNITE** : Présence régulière sur les **FNCS** et Cash Cups.\n" +
                        "• **ROCKET LEAGUE** : Grimper les échelons des **RLCS**.\n\n" +
                        "Que vous soyez dans l'Elite ou l'Academy, chaque membre porte haut nos couleurs. Découvrez nos effectifs ci-dessous ! 👇"
                    )
                    .setImage('attachment://presentation.gif')
                    .setFooter({ text: 'GOWRAX - ESport Team' });

                await interaction.channel.send({ embeds: [introEmbed], files: [file] });
                
                for (const game of ['valorant', 'fortnite', 'rl']) {
                    let data = interaction.client.db.get(`roster_${game}`) || { coach: "À définir", high: [], tryhard: [], academy: [], chill: [], messageId: null };
                    const embed = new EmbedBuilder()
                        .setTitle(`⚔️ GOWRAX | ROSTER ${config[game].title}`)
                        .setColor(config[game].color)
                        .setThumbnail(config[game].img)
                        .addFields(
                            { name: '🧠 COACHS / CAPITAINES', value: `${data.coach}`, inline: false },
                            { name: '💎 HIGH ROSTER (Elite)', value: formatList(data.high), inline: false },
                            { name: '🔥 TRYHARDEURS', value: formatList(data.tryhard), inline: true },
                            { name: '👶 ACADEMY (Jeunes)', value: formatList(data.academy), inline: true },
                            { name: '🧊 PÔLE CHILL', value: formatList(data.chill), inline: false }
                        );
                    const sent = await interaction.channel.send({ embeds: [embed] });
                    data.messageId = sent.id;
                    interaction.client.db.set(`roster_${game}`, data);
                }
                return interaction.editReply({ content: "✅ Présentation et panels initialisés !" });
            } else {
                // Affichage d'un seul jeu
                let data = interaction.client.db.get(`roster_${jeu}`) || { coach: "À définir", high: [], tryhard: [], academy: [], chill: [], messageId: null };
                const embed = new EmbedBuilder()
                    .setTitle(`⚔️ GOWRAX | ROSTER ${config[jeu].title}`)
                    .setColor(config[jeu].color)
                    .setThumbnail(config[jeu].img)
                    .addFields(
                        { name: '🧠 COACHS / CAPITAINES', value: `${data.coach}`, inline: false },
                        { name: '💎 HIGH ROSTER (Elite)', value: formatList(data.high), inline: false },
                        { name: '🔥 TRYHARDEURS', value: formatList(data.tryhard), inline: true },
                        { name: '👶 ACADEMY (Jeunes)', value: formatList(data.academy), inline: true },
                        { name: '🧊 PÔLE CHILL', value: formatList(data.chill), inline: false }
                    );
                const sent = await interaction.channel.send({ embeds: [embed] });
                data.messageId = sent.id;
                interaction.client.db.set(`roster_${jeu}`, data);
                return interaction.reply({ content: `✅ Panel ${jeu} envoyé !`, ephemeral: true });
            }
        }

        // --- LOGIQUE MODIFIER / CLEAR ---
        let data = interaction.client.db.get(`roster_${jeu}`) || { coach: "À définir", high: [], tryhard: [], academy: [], chill: [], messageId: null };

        const updateEmbed = async () => {
            if (data.messageId) {
                try {
                    const msg = await interaction.channel.messages.fetch(data.messageId);
                    const updatedEmbed = EmbedBuilder.from(msg.embeds[0])
                        .setFields(
                            { name: '🧠 COACHS / CAPITAINES', value: `${data.coach}`, inline: false },
                            { name: '💎 HIGH ROSTER (Elite)', value: formatList(data.high), inline: false },
                            { name: '🔥 TRYHARDEURS', value: formatList(data.tryhard), inline: true },
                            { name: '👶 ACADEMY (Jeunes)', value: formatList(data.academy), inline: true },
                            { name: '🧊 PÔLE CHILL', value: formatList(data.chill), inline: false }
                        );
                    await msg.edit({ embeds: [updatedEmbed] });
                } catch (e) { console.log("Erreur d'édition."); }
            }
        };

        if (sub === 'modifier') {
            const cat = interaction.options.getString('categorie');
            const joueursInput = interaction.options.getString('joueurs');
            if (cat === 'coach') data.coach = joueursInput;
            else {
                const nouveaux = joueursInput.split(',').map(name => name.trim()).filter(n => n !== "");
                data[cat] = [...new Set([...data[cat], ...nouveaux])];
            }
            interaction.client.db.set(`roster_${jeu}`, data);
            await updateEmbed();
            return interaction.editReply({ content: `✅ Mis à jour !` });        }

        if (sub === 'clear') {
            const cat = interaction.options.getString('categorie');
            if (cat === 'coach') data.coach = "À définir"; else data[cat] = [];
            interaction.client.db.set(`roster_${jeu}`, data);
            await updateEmbed();
            return interaction.reply({ content: `🗑️ Vidé !`, ephemeral: true });
        }
    }
};