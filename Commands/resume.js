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
    .setName('resume')
    .setDescription('Resumes the current song playing'),
  async execute(client, interaction, ops, dj) {
    //Precautions
    try { await interaction.deferReply(); } catch(err) { console.log('Assuming we are coming from another command.'); }
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.followUp({ content: `There currently isn't a song playing.`, ephemeral: true });
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.followUp({ content: `You need to be in a voice channel in order to resume the song!`, ephemeral: true });
    //If already paused, resume.
    if (fetched.player.state.status === 'paused') {
      fetched.player.unpause();
      interaction.followUp(`:thumbsup: **${fetched.queue[0].songTitle}** resumed!`);
    } else {
      interaction.followUp({ content: `The song is already playing.`, ephemeral: true });
    }
    
  }
}
