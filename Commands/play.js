const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageSelectMenu, MessageActionRow, Message, Client, IntegrationApplication, MessageEmbed } = require('discord.js');
const { AudioPlayerStatus,StreamType,createAudioPlayer,createAudioResource,joinVoiceChannel,VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
// This cookie allows ytdl-core to return age-restricted videos.
const COOKIE = 'VISITOR_INFO1_LIVE=1ajDgCOjhxU; YSC=BNVGtMvpPs4; PREF=tz=America.New_York&f6=40000000; HSID=A5C7Z4x1ibDlFczca; SSID=AICCFlsra24sA5Yd4; APISID=4iloUmvf1jKg7pt7/ABzUG8cFLRPFPwCFq; SAPISID=mENu4bRbT3andHPc/AkjOVLA2E6dlFoVQh; __Secure-1PAPISID=mENu4bRbT3andHPc/AkjOVLA2E6dlFoVQh; __Secure-3PAPISID=mENu4bRbT3andHPc/AkjOVLA2E6dlFoVQh; LOGIN_INFO=AFmmF2swRQIgT_prNoUqV74SvR_7uBCJEC-x7oZBTJYQHT6SoantJm4CIQDHZvSUdOBRVVZuhbaeHX60nvA0av2qRbk0vjMEQ8II7A:QUQ3MjNmeDNScXNkQ3pySUd0NkNYMjBlYndmZTdWcksxei1BbVhTY2UyVy00SkVLQXpEcWxia0wwQ050RktMQWJLWGxKNnBHblEwbkhwQ1Q4S2VKOEZhcnBCU3BrRkRKTmZSM1JaTTdLRU1SVGJqRzhVWDFYUTZuVWJYdXQ1R052WWhhcFZtVXRhbmpnSVZnMWJwRzRSTnJkVmRPd084MUJn; SID=EQjU4GyoI2HejRNYVC-622UT5BVcRmhjRHcmJyfM8OVYLdpdQh2Ng03f5w_fASSSGcPBXA.; __Secure-1PSID=EQjU4GyoI2HejRNYVC-622UT5BVcRmhjRHcmJyfM8OVYLdpdyp8oGRFjjoTn1O_HOkC-tw.; __Secure-3PSID=EQjU4GyoI2HejRNYVC-622UT5BVcRmhjRHcmJyfM8OVYLdpdWJroY-YjNf8bX2pJLeQdBw.; CONSISTENCY=AGDxDeNshEhhJ-WWt_050aISC12V_CRw5SWEf4zLFjlGW9Ew-Q5HkP-lU8XoPonwidc8Ek4wXJuzxfHWJDhudxUZLzewtVZKXUXcYsw1Pud3khaHm-B0LnAjfwShv8DE-nKf_HQKqjXoW10sENWxfKnS; SIDCC=AJi4QfG5nHBzwtnkdFvRagDDwqyXTFwmnQkzp_yA2hAP-FGIZdaHeW667FaS69YFJyF1I4wEKpo; __Secure-3PSIDCC=AJi4QfESFsM5CfIsazvONnofi3X0T978j0BeFu24T8kiGstV-nn2H9dipg7o7_3-JNHbpE8gjQ';

module.exports = {
    //Registers the play command
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays the specified song from YouTube.')
    .addStringOption(option => 
      option.setName('song')
        .setDescription('Insert the title or URL of a YouTube video.')
        .setRequired(true)),

  async execute(client, interaction, ops, url) {
    
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.reply({ content: `You need to be in a voice channel in order to play music.`, ephemeral: true });
    let data = ops.active.get(interaction.guild.id) || {};
    let vid;
    let qChannel = interaction.channel;
    if (url) {
      vid = url;
    } else {
      vid = interaction.options.getString('song');
    }

    //If vid is a url, go on. If not, go through the search command.
    const validateV = ytdl.validateURL(vid);
    const validateP = ytpl.validateID(vid, function(err, playlist) {
      console.log('Not a playlist.');
    });


    if (!validateP && !validateV) {
      let commandFile = require('./search.js');
      return commandFile.execute(client, interaction, ops);
    }

    //Identifies the member and the vc they're in
    let uid = interaction.user.id;
    
    let guild = interaction.guild;


    //Join the vc
    data.connection = joinVoiceChannel({
      channelId: member.voice.channel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });



    console.log(`joining and playing ${vid}`);
    try { await interaction.reply(`Loading song...`); }
    catch(err) { await interaction.editReply(`Loading song...`); }
    let info;
    let playlist = {};


    if (validateV) { 
      try {
        info = await ytdl.getInfo(vid, { requestOptions: { headers: { cookie: COOKIE, } } });
      }
      catch (err) {
        interaction.editReply(`Loading song... **FAILED.**`)
        qChannel.send('**ERROR** Something when wrong while playing this song _(Could it be age-restricted?)_');
        return console.log(err);
      }
    } else if (validateP) {
      try {
        info = await ytpl(vid, { requestOptions: { headers: { cookie: COOKIE, } } });
      }
      catch (err) {
        interaction.editReply(`Loading song... **FAILED.**`)
        qChannel.send('**ERROR** Something when wrong while playing this playlist _(Could it be too long?)_');
        return console.log(err);
      }
    }
    console.log(info.items);
    console.log(info);



    if (!data.queue) data.queue = [];
    if (!data.loop) data.loop = "no";
    data.guildID = interaction.guild.id;

    
    let min;
    let sec;
    if (validateV) {
      min = Math.floor(info.videoDetails.lengthSeconds/60);
      sec = info.videoDetails.lengthSeconds-min*60;
      if (sec < 10) {
        sec = `0${info.videoDetails.lengthSeconds-min*60}`;
      }
      data.queue.push({
        songTitle: info.videoDetails.title,
        author: info.videoDetails.author.name,
        requester: interaction.user,
        url: vid,
        thumb: info.videoDetails.thumbnails[0].url,
        duration: `${min}:${sec}`
      })
    }
    let qLength;
    if (validateP) {
      qLength = data.queue.length;
      for (var pp in info.items) {
        data.queue.push({
          songTitle: info.items[pp].title,
          author: info.items[pp].author.name,
          requester: interaction.user,
          url: info.items[pp].url,
          thumb: info.items[pp].thumbnails[0].url,
          duration: info.items[pp].duration,
          isPL: true,
          plTitle: info.title,
          plAuthor: info.author.name,
          plThumb: info.bestThumbnail.url,
          plUrl: info.url,
        })
      }
    }



    // Push a new song into the queue
    let embedQ = new MessageEmbed()
    if (validateV) {
        embedQ.setColor('#E74C3C')
        embedQ.setAuthor('ADDED TO QUEUE:')
        embedQ.setTitle(`${info.videoDetails.title}`)
        embedQ.setURL(vid)
        embedQ.setDescription(`By: ${info.videoDetails.author.name}\n\nDuration: (${min}:${sec})\n\n`)
        embedQ.setThumbnail(info.videoDetails.thumbnails[0].url)
        embedQ.setFooter(`Requested by ${interaction.user.username}. #${data.queue.length-1} in queue.`, `${interaction.user.displayAvatarURL()}`)
    }
    if (validateP) {
        embedQ.setColor('#E74C3C')
        embedQ.setAuthor(`ADDED ${info.items.length} SONGS TO QUEUE:`)
        embedQ.setTitle(`${info.title}`)
        embedQ.setURL(vid)
        embedQ.setDescription(`By: ${info.author.name}\n\nFirst Song: ${info.items[0].title}`)
        embedQ.setThumbnail(info.bestThumbnail.url)
        embedQ.setFooter(`Requested by ${interaction.user.username}. #${qLength} in queue.`, `${interaction.user.displayAvatarURL()}`)
    }

    interaction.deleteReply();
    if (!data.stream) {
      await playsong(client, ops, data, qChannel, true);
      
    } else {
      interaction.channel.send({ embeds: [embedQ] });
    }
    ops.active.set(interaction.guild.id, data);

    async function playsong(client, ops, data, qchan, showNP)
    {

      let embedP = new MessageEmbed()
        .setColor('#E74C3C')
        .setAuthor('NOW PLAYING:')
      if (data.queue[0].isPL) {
        embedP.setTitle(`${data.queue[0].plTitle}`);
        embedP.setURL(data.queue[0].plUrl);
        embedP.setDescription(`By: ${data.queue[0].plAuthor}\n\nFirst Song: ${data.queue[0].songTitle}`);
        embedP.setThumbnail(`${data.queue[0].plThumb}`);
        embedP.setFooter(`Requested by ${data.queue[0].requester.username}.`, `${data.queue[0].requester.displayAvatarURL()}`);
      } else {
        embedP.setTitle(`${data.queue[0].songTitle}`);
        embedP.setURL(data.queue[0].url);
        embedP.setDescription(`By: ${data.queue[0].author}\n\nDuration: (${data.queue[0].duration})\n\n`);
        embedP.setThumbnail(`${data.queue[0].thumb}`);
        embedP.setFooter(`Requested by ${data.queue[0].requester.username}.`, `${data.queue[0].requester.displayAvatarURL()}`);
      }


      if (showNP) qchan.send({ embeds: [embedP] });
      try { 
        data.stream = ytdl(data.queue[0].url, {
          filter: 'audioonly',
          requestOptions: {
            headers: {
              cookie: 'VISITOR_INFO1_LIVE=1ajDgCOjhxU; YSC=BNVGtMvpPs4; PREF=tz=America.New_York&f6=40000000; HSID=A5C7Z4x1ibDlFczca; SSID=AICCFlsra24sA5Yd4; APISID=4iloUmvf1jKg7pt7/ABzUG8cFLRPFPwCFq; SAPISID=mENu4bRbT3andHPc/AkjOVLA2E6dlFoVQh; __Secure-1PAPISID=mENu4bRbT3andHPc/AkjOVLA2E6dlFoVQh; __Secure-3PAPISID=mENu4bRbT3andHPc/AkjOVLA2E6dlFoVQh; LOGIN_INFO=AFmmF2swRQIgT_prNoUqV74SvR_7uBCJEC-x7oZBTJYQHT6SoantJm4CIQDHZvSUdOBRVVZuhbaeHX60nvA0av2qRbk0vjMEQ8II7A:QUQ3MjNmeDNScXNkQ3pySUd0NkNYMjBlYndmZTdWcksxei1BbVhTY2UyVy00SkVLQXpEcWxia0wwQ050RktMQWJLWGxKNnBHblEwbkhwQ1Q4S2VKOEZhcnBCU3BrRkRKTmZSM1JaTTdLRU1SVGJqRzhVWDFYUTZuVWJYdXQ1R052WWhhcFZtVXRhbmpnSVZnMWJwRzRSTnJkVmRPd084MUJn; SID=EQjU4GyoI2HejRNYVC-622UT5BVcRmhjRHcmJyfM8OVYLdpdQh2Ng03f5w_fASSSGcPBXA.; __Secure-1PSID=EQjU4GyoI2HejRNYVC-622UT5BVcRmhjRHcmJyfM8OVYLdpdyp8oGRFjjoTn1O_HOkC-tw.; __Secure-3PSID=EQjU4GyoI2HejRNYVC-622UT5BVcRmhjRHcmJyfM8OVYLdpdWJroY-YjNf8bX2pJLeQdBw.; CONSISTENCY=AGDxDeNshEhhJ-WWt_050aISC12V_CRw5SWEf4zLFjlGW9Ew-Q5HkP-lU8XoPonwidc8Ek4wXJuzxfHWJDhudxUZLzewtVZKXUXcYsw1Pud3khaHm-B0LnAjfwShv8DE-nKf_HQKqjXoW10sENWxfKnS; SIDCC=AJi4QfG5nHBzwtnkdFvRagDDwqyXTFwmnQkzp_yA2hAP-FGIZdaHeW667FaS69YFJyF1I4wEKpo; __Secure-3PSIDCC=AJi4QfESFsM5CfIsazvONnofi3X0T978j0BeFu24T8kiGstV-nn2H9dipg7o7_3-JNHbpE8gjQ',
            }
          }
        });
      }
      catch (err) {
        qchan.send('Something when wrong while playing this song (Could it be age-restricted?)');
        console.log(err);
        endofsong(client, ops, data);
      }

      data.stream.guildID = data.guildID;
      const resource = createAudioResource(data.stream, { inputType: StreamType.Arbitrary });
      data.resource = resource;
      data.player = createAudioPlayer();
      data.player.play(resource);
      
      const subscription = data.connection.subscribe(data.player);
      data.player.on('error', err => {
        console.log(err);
        qchan.send(`An error occurred. Attempting to start song from beginning`);
        try {
        playsong(client, ops, data, qchan, false);
        }
        catch (error) {
          console.log(error);
          qchan.send(`Failed to start song`);
        }
      })
      data.player.on(AudioPlayerStatus.Idle, () => {
        endofsong(client, ops, data, qchan);
      })
    }

    async function endofsong(client, ops, data, qchan) {
      let fetched = ops.active.get(data.stream.guildID);
      if (fetched.loop === "yes") {
        return playsong(client, ops, data, qchan, false);
      }
      fetched.queue.shift();
      if (fetched.queue.length > 0) {
        ops.active.set(data.stream.guildID, fetched);
        playsong(client, ops, data, qchan, false);
      } else {
        ops.active.delete(data.stream.guildID);
        data.connection.destroy();
      }
    }
    
    data.connection.on(VoiceConnectionStatus.Destroyed, () => {
      ops.active.delete(data.stream.guildID);
      data.queue = [];
    })
    data.connection.on(VoiceConnectionStatus.Disconnected, () => {
      ops.active.delete(data.stream.guildID);
      data.queue = [];
    })
  },


}

