const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
  musicCommand: true,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription("Shows what songs are queues and provides controls."),
  async execute(client, interaction, ops, dj) {
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.reply(`**There currently isn't any music playing.**`);
    let queue = fetched.queue;
    let nowPlaying = queue[0];
    let timeStamp = Math.floor(fetched.resource.playbackDuration/1000);
    let min = Math.floor(timeStamp/60);
    let sec = timeStamp-min*60;
    if (sec < 10) {
      sec = `0${timeStamp-min*60}`;
    }
    let pageN = 1;
    let maxPages = Math.ceil(queue.length/10);
    let embed = new MessageEmbed()
      .setAuthor(`Queue for ${interaction.guild.name}:`)

    let queueList = queue.slice(0*pageN, 10*pageN);
    

    //Now for the buttons lmao
    const prev = new MessageButton()
      .setCustomId('prev')
      .setLabel('<')
      .setStyle('SUCCESS')

    const np = new MessageButton()
      .setLabel('Now Playing')
      .setStyle('LINK')
      .setURL(nowPlaying.url)
    const paurem = new MessageButton()
      .setCustomId('paurem')
      .setLabel('Pause/Resume')
      .setStyle('PRIMARY')
    const skip =  new MessageButton()
      .setCustomId('skip')
      .setLabel('Skip')
      .setStyle('PRIMARY')
    const next = new MessageButton()
      .setCustomId('next')
      .setLabel('>')
      .setStyle('SUCCESS')

    const row = new MessageActionRow()
      .setComponents(
        prev,
        np,
        paurem,
        skip,
        next
      )

    await interaction.reply({ embeds: [embed], components: [row] });
    updater();


    const collector = interaction.channel.createMessageComponentCollector({ componentType: 'BUTTON', time: 15000 });
      
    collector.on('collect', async i => {
      if (i.user.id === interaction.user.id) {
        switch (i.customId) {
          case 'skip':
            const skippy = require('./skip.js');
            skippy.execute(client, interaction, ops);
            await i.update({ embeds: [embed], components: [row] });
            collector.resetTimer();
            break;
          case 'next':
            if (pageN >= maxPages) {}
            else { pageN += 1; }
            
            await i.update({ embeds: [embed], components: [] });
            collector.resetTimer();
            updater();
            break;
          case 'paurem':
            let pauremmy;
            if (fetched.player.state.status === 'paused') {
              pauremmy = require('./resume.js');
            } else {
              pauremmy = require('./pause.js');
            }
            pauremmy.execute(client, interaction, ops);
            collector.resetTimer();
            await i.update({ embeds: [embed], components: [] });
            updater();
            break;
          case 'prev':
            if (pageN -= 1) {}
            else { pageN -= 1; }
            
            await i.update({ embeds: [embed], components: [] });
            updater();
            collector.resetTimer();
            break;
            
        }
      }
    })
    collector.on('end', async collected => {
      await interaction.editReply({ embeds: [embed], components: [] });
    })


    async function updater() {
      nowPlaying = queue[0];
      timeStamp = Math.floor(fetched.resource.playbackDuration/1000);
      min = Math.floor(timeStamp/60);
      sec = timeStamp-min*60;
      if (sec < 10) {
        sec = `0${timeStamp-min*60}`;
      }
      queueList = queue.slice(-10+(pageN*10), 10*pageN);
      let penisidk = 10*(pageN-1);
      embed.setTitle(`Page ${pageN}:`);
      if (fetched.player.state.status === 'paused') {
        embed.setColor('#E74C3C')
        embed.setDescription(`**NOW PLAYING: [PAUSED] ${nowPlaying.songTitle}**\n(${min}:${sec}/${nowPlaying.duration}) **-----** _Requester: ${nowPlaying.requester}_\n**----------------------------------**`);
      } else {
        embed.setColor('#50C878')
        embed.setDescription(`**NOW PLAYING: ${nowPlaying.songTitle}**\n(${min}:${sec}/${nowPlaying.duration}) **-----** _Requester: ${nowPlaying.requester}_\n**----------------------------------**`);
      }
      
      embed.fields = [];
      for (var i in queueList) {
        if (queue[1]) {
          let ii = parseInt(i)+1+penisidk;
          embed.addField(`**[#${ii}]: ${queue[ii-1].songTitle}**`, `(${queue[ii-1].duration}) **-----** _Requester: ${queue[ii-1].requester}_`);
        }
      }

      await interaction.editReply({ embeds: [embed], components: [row] });
      

    }

    fetched.connection.on(VoiceConnectionStatus.Destroyed, () => {
      interaction.editReply({ embeds: [embed], components: [] });
    })
    fetched.connection.on(VoiceConnectionStatus.Disconnected, () => {
      interaction.editReply({ embeds: [embed], components: [] });
    })
  }
}
