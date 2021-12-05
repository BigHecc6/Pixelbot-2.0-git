const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require ('@discordjs/voice');
const { Permissions } = require('discord.js');

module.exports = {
  musicCommand: true,
  guildOnly: true,
  perms: [
    Permissions.FLAGS.MANAGE_MESSAGES
  ],
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses the current song playing'),
  async execute(client, interaction, ops, dj) {
    try { await interaction.deferReply(); } catch(err) { console.log('Assuming we are coming from another command.'); }
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.followUp({ content: `There currently isn't a song playing.`, ephemeral: true });
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.followUp({ content: `You need to be in a voice channel in order to pause the song!`, ephemeral: true });
    if (fetched.player.state.status === 'playing') {
      fetched.player.pause();
      interaction.followUp(`:thumbsup: **${fetched.queue[0].songTitle}** paused!`);
    } else {
      interaction.followUp({ content: `The song is already paused.`, ephemeral: true });
    }
    
  }
}
