//Call main modules
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
	intents: [
	  Intents.FLAGS.GUILDS,
	  Intents.FLAGS.GUILD_MESSAGES,
	  Intents.FLAGS.GUILD_MEMBERS,
	  Intents.FLAGS.GUILD_PRESENCES,
	  Intents.FLAGS.GUILD_VOICE_STATES,
	],
  });
const active = new Map();


//Command handling
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

//Event Handler
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

//Message Listener
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);
	const ops = {
		active: active
	}

	if (!command) return;
	if (command.guildOnly && !interaction.guild) {
		return interaction.reply({ content: `You can only use this command while in a server!`, ephemeral: true });
	}
	try {
		await command.execute(client, interaction, ops);
	} catch (error) {
		console.error(error);
		return interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


//Login to bot
client.login(process.env.DICKSWORD);
