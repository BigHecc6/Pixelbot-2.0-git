const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription("Shows what songs are queues and provides controls."),
  async execute(client, interaction, ops) {
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.reply(`**There currently isn't any music playing.**`);
    let queue = fetched.queue;
    let nowPlaying = queue[0];

    let resp = `__**NOW PLAYING:**\n**${nowPlaying.songTitle}** -- **Requested By:** *${nowPlaying.requester}*\n\n__**Queue:**__\n`;
    for (var i=1; i<queue.length; i++) {
      resp += `(${i}). **${queue[i].songTitle}** -- **Requested By:** *${queue[i].requester}*\n`;
    }
    interaction.reply(resp);
  }
}
