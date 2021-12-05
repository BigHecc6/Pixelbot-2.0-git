const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

module.exports = {
  perms: [
    Permissions.FLAGS.MANAGE_MESSAGES
  ],
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffles the queue.'),
  async execute(client, interaction, ops) {
    try { await interaction.deferReply(); } catch(err) { console.log('Assuming we are coming from another command.'); }
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.followUp({ content: `There currently isn't a song playing.`, ephemeral: true });
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.followUp({ content: `You need to be in a voice channel in order to pause the song!`, ephemeral: true });
    if (!fetched.queue[2]) return interaction.followUp({ content: `There aren't enough songs in queue to be able to shuffle them!`, ephimeral: true });
    let queueL = fetched.queue.slice(1, fetched.queue.length);
    for (let i = queueL.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i+1));
      [queueL[i], queueL[j]] = [queueL[j], queueL[i]];
      
    }
    fetched.queue.splice(1, fetched.queue.length-1);
    for (var i in queueL) {
      fetched.queue.splice(1, 0, queueL[i]);
    }
    await interaction.followUp(`**Queue shuffled!**`);
    

  }
}
