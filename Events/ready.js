module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Established connection to server!`);
    },
};