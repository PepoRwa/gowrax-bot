module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} est prêt et organisé !`);
        client.user.setActivity('GOWRAX Network', { type: 3 });
        client.user.setStatus('dnd');
    },
};