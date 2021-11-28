const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');
const noSkip = ['ram ranch', '3 big balls', 'three big balls', 'gay nigga hours'];

module.exports = {
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song playing'),
  async execute(client, interaction, ops) {
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.reply({ content: `There currently isn't any music playing.`, ephemeral: true });
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.reply({ content: `You need to be in a voice channel in order to skip the song!`, ephemeral: true });
    let title = fetched.queue[0].songTitle;
    for(var i in noSkip) {
      if (title.toLowerCase().includes(noSkip[i])) {
        return interaction.reply({content: `** You shall not skip ${title}.**`, ephemeral: true });
      }
    }
    let qchan = interaction.channel.id;
    let userCount = interaction.guild.me.voice.channel.members.size;

    let required = Math.ceil(userCount/2);
    if (!fetched.queue[0].voteSkips) fetched.queue[0].voteSkips = [];
    if (fetched.queue[0].voteSkips.includes(interaction.user.id)) return interaction.reply({ content: `You already voted to skip! **${fetched.queue[0].voteSkips.length}/${required} required.` });
    fetched.queue[0].voteSkips.push(interaction.user.id);
    ops.active.set(interaction.guild.id, fetched);
    if (fetched.queue[0].voteSkips.length >= required) {
      if (!fetched.queue[1]) {
        interaction.reply(`**${fetched.queue[0].songTitle}** skipped.`);
        return fetched.connection.destroy();
      }
      interaction.reply(`**${fetched.queue[0].songTitle}** skipped.`);
      return fetched.player.emit(AudioPlayerStatus.Idle);
    }
  }
}

//Fix skip command

