const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { Permissions } = require('discord.js');
const queue = require('./queue');
const noSkip = ['ram ranch', '3 big balls', 'three big balls', 'gay nigga hours', 'touch-tone telephone', 'touch tone telephone', 'cabinet man'];

module.exports = {
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song playing')
    .addIntegerOption(option =>
      option.setName('amount')
      .setDescription('Number of songs to skip')),
  async execute(client, interaction, ops) {
    try { await interaction.deferReply(); } catch(err) { console.log('Assuming we are coming from another command.'); }

    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.followUp({ content: `There currently isn't any music playing.`, ephemeral: true });
    
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.followUp({ content: `You need to be in a voice channel in order to skip the song!`, ephemeral: true });
    let numOp = interaction.options.getInteger('amount');
    let amount;
    if (numOp <= 0) amount = 0; else amount = numOp-1;
    if (amount >= fetched.queue.length) amount = fetched.queue.length-1;
    let title = fetched.queue[0].songTitle;
    for(var i in noSkip) {
      if (title.toLowerCase().includes(noSkip[i])) {
        return interaction.followUp({content: `** You shall not skip ${title}.**`, ephemeral: true });
      }
    }
    let qchan = interaction.channel.id;
    let userCount = interaction.guild.me.voice.channel.members.size;
    
    if (interaction.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES, true)) {
      fetched.loop = "no";
      if (amount >= 2) {
        await interaction.followUp(`Skipped **${amount}** songs.`);
      } else {
        await interaction.followUp(`**${fetched.queue[0].songTitle}** skipped.`);
      }
      
      let origLength = fetched.queue.length;
      fetched.player.emit(AudioPlayerStatus.Idle);
      for (var i = amount; fetched.queue.length != origLength - i;) {
        fetched.queue.shift();
      }
      return fetched.player.emit(AudioPlayerStatus.Idle);
    }
    let required = Math.ceil(userCount/2);
    
    if (!fetched.queue[0].voteSkips) fetched.queue[0].voteSkips = [];
    if (fetched.queue[0].voteSkips.includes(interaction.user.id)) return interaction.followUp({ content: `You already voted to skip! **${fetched.queue[0].voteSkips.length}/${required} required.**`, ephemeral: true });
    fetched.queue[0].voteSkips.push(interaction.user.id);
    ops.active.set(interaction.guild.id, fetched);
    if (fetched.queue[0].voteSkips.length >= required) {
      fetched.loop = "no";
      if (!fetched.queue[1]) {
        await interaction.followUp(`**${fetched.queue[0].songTitle}** skipped.`);

        return fetched.connection.destroy();
      }
      interaction.followUp(`**${fetched.queue[0].songTitle}** skipped.`);
      return fetched.player.emit(AudioPlayerStatus.Idle);
      
    }
    //const user = interaction.user;
    interaction.followUp(`${user} has voted to skip! **${fetched.queue[0].voteSkips.length}/${required} required to skip.**`);
    interaction.followUp({ content: `You must have the MANAGE_MESSAGES permission to skip multiple songs at once.`, ephemeral: true });
  }
}


