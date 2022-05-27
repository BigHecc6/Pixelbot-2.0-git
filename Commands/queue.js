const { SlashCommandBuilder } = require('@discordjs/builders');
const { AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { MessageEmbed, MessageActionRow, MessageButton, ContextMenuInteraction } = require('discord.js');

module.exports = {
  musicCommand: true,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription("Shows what songs are queues and provides controls."),
  async execute(client, interaction, ops, dj) {
    //Check if there's anything in the queue.
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.editReply({ content:`**There currently isn't any music playing.**`, ephemeral: true });
   
    //Initialize variables
    let combTime = 0;
    let cMin;
    let cSec;
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
    

    //Embed buttons
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

    //Initial message
    await interaction.followUp({ embeds: [embed], components: [row] });
    updater();


    const collector = interaction.channel.createMessageComponentCollector({ componentType: 'BUTTON', time: 15000 });
    //Button collecting yay  
    collector.on('collect', async i => {
      if (i.user.id === interaction.user.id) {
        switch (i.customId) {
          case 'skip':
            const skippy = require('./skip.js');
            skippy.execute(client, interaction, ops);
            await i.update({ embeds: [embed], components: [row] });
            collector.resetTimer();
            updater();
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
            if (pageN <= 1) {}
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
      //This will run any time something happens while the queue menu is still up.
      timeStamp = Math.floor(fetched.resource.playbackDuration/1000);
      combTime = parseInt(queue[0].durationSec-timeStamp);
      nowPlaying = queue[0];
      for (var i in queue) {
        combTime += parseInt(queue[i].durationSec);
      }
      combTime -= queue[0].durationSec;
      
      cMin = Math.floor(combTime/60);
      
      cSec = combTime-cMin*60;
      if (cSec < 10) { cSec = `0${combTime-cMin*60}`; }
      np.setURL(nowPlaying.url);
      
      min = Math.floor(timeStamp/60);
      sec = timeStamp-min*60;
      if (sec < 10) {
        sec = `0${timeStamp-min*60}`;
      }
      queueList = queue.slice(-10+(pageN*10), 10*pageN);
      let curMax;
      if (10*pageN >= queue.length) curMax = queue.length; else curMax = 10*pageN;
      let penisidk = 10*(pageN-1);
      embed.setTitle(`Page ${pageN}:`);
      embed.setFooter(`${-10+(pageN*10)+1} of ${curMax} of ${queue.length} --- ${cMin}:${cSec} remaining`);
      if (fetched.player.state.status === 'paused') {
        embed.setColor('#E74C3C')
        embed.setDescription(`**NOW PLAYING: [PAUSED] __${nowPlaying.songTitle}__** by **${nowPlaying.author}**\n(${min}:${sec}/${nowPlaying.duration}) **-----** _Requester: ${nowPlaying.requester}_\n**----------------------------------**`);
      } else {
        embed.setColor('#50C878')
        embed.setDescription(`**NOW PLAYING: __${nowPlaying.songTitle}__** by **${nowPlaying.author}**\n(${min}:${sec}/${nowPlaying.duration}) **-----** _Requester: ${nowPlaying.requester}_\n**----------------------------------**`);
      }
      
      embed.fields = [];
      for (var i in queueList) {
        if (queue[1]) {
          let ii = parseInt(i)+1+penisidk;
          embed.addField(`**[#${ii}]: __${queue[ii-1].songTitle}__** by **${queue[ii-1].author}**`, `(${queue[ii-1].duration}) **-----** _Requester: ${queue[ii-1].requester}_`);
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
