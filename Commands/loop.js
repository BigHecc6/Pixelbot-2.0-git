const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggles whether the current song loops.'),
  async execute(client, interaction, ops) {
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.reply({ content: `There currently isn't any music playing.`, ephemeral: true });
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.reply({ content: `You need to be in a voice channel in order to skip the song!`, ephemeral: true });

    fetched.loop = true;
  }
}
