const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require ('@discordjs/voice');

module.exports = {
  musicCommand: true,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resumes the current song playing'),
  async execute(client, interaction, ops, dj) {
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.reply({ content: `There currently isn't a song playing.`, ephemeral: true });
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.reply({ content: `You need to be in a voice channel in order to resume the song!`, ephemeral: true });
    if (interaction.member.roles.cache.some(role => role.name.toLowerCase() != 'dj')) return interaction.reply({ content: `You must be DJ in order to use this`, ephemeral: true });
    if (AudioPlayerStatus.Paused) {
      fetched.player.unpause();
      interaction.reply(`:thumbsup: **${fetched.queue[0].songTitle}** resumed!`);
    } else {
      interaction.reply({ content: `The song is already playing.`, ephemeral: true });
    }
    
  }
}
