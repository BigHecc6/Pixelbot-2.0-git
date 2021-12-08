const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Removes a song from queue.')
    .addIntegerOption(option =>
      option.setName('item')
        .setDescription('Number of queue item to remove')
        .setRequired(true)),
  async execute(client, interaction, ops) {
    //Precautions
    try { await interaction.deferReply(); } catch(err) { console.log('Assuming we are coming from another command.'); }
    let fetched = ops.active.get(interaction.guild.id);
    if (!fetched) return interaction.followUp({ content: `There currently isn't any music playing.`, ephemeral: true });
    let member = await interaction.member.fetch();
    if (!member.voice.channel) return interaction.followUp({ content: `You need to be in a voice channel in order to remove the song!`, ephemeral: true });
    
    //Get the option and turn it into a variable
    let item = interaction.options.getInteger('item');
    if (item <= 1) return interaction.followUp({ content: `are you fucking stupid?`, ephemeral: true });
    if (item > fetched.queue.length) return interaction.followUp({ content: `There aren't even that many songs in the queue!`, ephemeral: true });
    let num = parseInt(item)-1
    ;
    //Remove the song
    await interaction.followUp(`**Removed ${fetched.queue[num].songTitle} from queue.`);
    console.log(`Removed ${fetched.queue[num].songTitle} in ${interaction.guild.name}.`);
    fetched.queue.splice(num);
    




  }
}
