const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggles whether the current song loops.'),
  async execute(client, interaction, ops) {
    //Precautions
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.editReply({ content: `There currently isn't any music playing.`, ephemeral: true });
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.editReply({ content: `You need to be in a voice channel in order to skip the song!`, ephemeral: true });
    
    //Toggle loop
    switch (fetched.loop) {
      case ('no'):
        fetched.loop = 'yes';
        interaction.editReply(`**${fetched.queue[0].songTitle}** will now loop :arrows_clockwise:`);
        break;
      case ('yes'):
        fetched.loop = 'no';
        interaction.editReply(`**${fetched.queue[0].songTitle}** will no longer loop :arrow_right:`);
        break;
    }

  }
}
