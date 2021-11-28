const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageSelectMenu, MessageActionRow, Message, Client, IntegrationApplication } = require('discord.js');
const yt = require('ytdl-core');
const ffmpeg = require('ffmpeg');
const search = require('yt-search');
const wait = require('util').promisify(setTimeout);
const ytdl = require('ytdl-core');
let urlV;


module.exports = {
    //Registers the play command
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Searches for a song.')
    .addStringOption(option => 
      option.setName('song')
        .setDescription('Insert the title or URL of a YouTube video.')
        .setRequired(true)),

  async execute(client, interaction, ops) {
    let queue = {};
    const vid = interaction.options.getString('song');
    interaction.reply('Searching for **' + vid + '**...');
    //If the video isn't in url form, search for it.
    const validate = yt.validateURL(vid);
    try {
        if (!validate) {
            await search(vid, function ( err, r ) {
                //Throw error
                if (err) {
                    interaction.editReply('Searching for **' + vid + '**... FAILED.');
                    interaction.followUp({ content: 'Something went wrong when executing this command.', ephemeral: true });
                    console.log(err);
                    return;
                }
                //Picks the top 10 videos from results
                let videos = r.videos.slice(0, 10);
                let resp = '';

                for (var i in videos) {
                    resp += `**[${parseInt(i) + 1}]:** \`${videos[i].title}\`\n`;
                }
                resp += `\n**Please choose one of the ${videos.length} videos found.**`;

                //Menu where you can select the video
                const selel = new MessageSelectMenu()
                    .setCustomId('selectVid')
                    .setPlaceholder('No video selected')

                const row = new MessageActionRow()

                //Adds selection for each video
                for (var i in videos) {
                    row.setComponents(
                        selel.addOptions([
                            {
                            label: `${videos[i].title}`,
                            description: videos[i].author.name,
                            value: `${videos[i].url}`,
                            },
                        ]),
                    );
                }
                interaction.followUp({ content: resp, components: [row] });
                //Collects video selection
                const filter = i => i.customId === 'selectVid';
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
                let video;
                collector.once('collect', async i => {
                    if (i.customId === 'selectVid') {
                        await interaction.deleteReply();
                        video = i.values[0];
                        await i.update({ content: `Video selected: ${video}.`, components: [] });
                        let commandFile = require('./play.js');
                        
                        collector.stop();
                        
                    }
                })
                collector.on('end', collected => {
                console.log(video);
                urlV = video;
                let commandFile = require('./play.js');
                return commandFile.execute(client, interaction, ops, urlV);
                })

            })

        } else {
            urlV = vid;
        }
    }

    catch (err) {
        interaction.editReply('Searching for **' + vid + '**... FAILED.');
        interaction.followUp({ content: `Something wrong happened while searching for your video.`, ephemeral: true });
    }

    


  }
}

//Find out a way to handle two instances of command at once; normally crashes