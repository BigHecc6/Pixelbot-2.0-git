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
const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./Commands/${file}`);
	client.commands.set(command.data.name, command);
}

//Event Handler
const eventFiles = fs.readdirSync('./Events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./Events/${file}`);
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
	if (command.perms) {
		if (interaction.guild.ownerId != interaction.member.id)
		{
			for (var p in command.perms) {
				if (interaction.member.permissions.missing(p, { checkAdmin: true, checkOwner: true })) {
					return interaction.reply({ content: `You don't have the permissions to use this command.`, ephemeral: true });
				}
			}
		}
	}
	try {
		await command.execute(client, interaction, ops);
	} catch (error) {
		console.error(error);
		try {
			return interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
		catch {
			return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
		
	}
});

const statusQ = [
	"with an early access build"
]
const statusT = [
	"PLAYING",
]

client.once('ready', () => {
	status();
})
//Login to bot
client.login(process.env.DICKSWORD);


async function status() {

	let ranStat = Math.floor(Math.random()*statusT.length);
	client.user.setActivity(statusQ[ranStat], { type: statusT[ranStat] });
	console.log(`Changed status to: ${statusT[ranStat]} ${statusQ[ranStat]}`);
	setInterval(status, Number(1.8E6));
	
}
