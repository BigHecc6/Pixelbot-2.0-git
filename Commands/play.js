const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageSelectMenu, MessageActionRow, Message, Client, IntegrationApplication } = require('discord.js');
const yt = require('ytdl-core');
const ffmpeg = require('ffmpeg');
const search = require('yt-search');
const wait = require('util').promisify(setTimeout);
const { AudioPlayerStatus,StreamType,createAudioPlayer,createAudioResource,joinVoiceChannel,VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
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
    const validate = ytdl.validateURL(vid);
    if (!validate) {
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
    let info;
    try {
      info = await ytdl.getInfo(vid, {
        requestOptions: {
          headers: {
            cookie: COOKIE,
          }
        }
      });
   }
    catch(err) {
      qChannel.send('**ERROR** Something when wrong while playing this song _(Could it be age-restricted?)_');
      return console.log(err);
    }
    if (!data.queue) data.queue = [];
    data.guildID = interaction.guild.id;
    // Push a new song into the queue
    data.queue.push({
      songTitle: info.videoDetails.title,
      requester: interaction.user,
      url: vid,
      thumb: info.thumbnail_url,
    })


    if (!data.stream) await playsong(client, ops, data, qChannel);
    else {
      interaction.channel.send(`${info.videoDetails.title} added to queue. | Requested by: ${interaction.user}.`);
    }
    ops.active.set(interaction.guild.id, data);

    async function playsong(client, ops, data, qchan)
    {
      qchan.send(`Now Playing: ${data.queue[0].songTitle} | Requested By: ${data.queue[0].requester}.`);
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
      data.player = createAudioPlayer();
      data.player.play(resource);
      console.log(data.player.eventNames());
      const subscription = data.connection.subscribe(data.player);
      data.player.on(AudioPlayerStatus.Idle, () => {
        endofsong(client, ops, data, qchan);
      })
    }

    async function endofsong(client, ops, data, qchan) {
      let fetched = ops.active.get(data.stream.guildID)
      fetched.queue.shift();
      if (fetched.queue.length > 0) {
        ops.active.set(data.stream.guildID, fetched);
        playsong(client, ops, data, qchan);
      } else {
        ops.active.delete(data.stream.guildID);
        data.connection.destroy();
      }
    }
    
    data.connection.on(VoiceConnectionStatus.Destroyed, () => {
      ops.active.delete(data.stream.guildID);
      data.queue = [];
    })
  },


}

