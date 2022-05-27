//Call main modules
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
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
const commands = [];
const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./Commands/${file}`);
	client.commands.set(command.data.name, command);
	commands.push(command.data.toJSON());
}
//Command Deployer
const rest = new REST({ version: '9' }).setToken(process.env.DICKSWORD);

rest.put(Routes.applicationCommands(process.env.CLITID), { body: commands })
	.then(() => console.log('Commands have been deployed.'))
	.catch(console.error);

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
	await interaction.deferReply();

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
					if (interaction.user.id != '556520399102541830') {
						return interaction.reply({ content: `You don't have the permissions to use this command.`, ephemeral: true });
					}
				}
			}
		}
	}
	try {
		await command.execute(client, interaction, ops);
	} catch (error) {
		console.error(error);
		if (interaction.isRepliable) {
			return await interaction.reply({ content: 'There was an error while executing this command!\n```' + error + '```', ephemeral: true });
		} else {
			return await interaction.editReply({ content: 'There was an error while executing this command!\n```' + error + '```', ephemeral: true })
		}
		
	}
});

const status = [
	["with Carson's mom's entiddies", "PLAYING"],
	["thughunter.com", "WATCHING"]
]

client.once('ready', () => {
	statusSet();
})
//Login to bot
client.login(process.env.DICKSWORD);


async function statusSet() {

	let ranStat = Math.floor(Math.random()*status.length);
	client.user.setActivity(status[ranStat][0], { type: status[ranStat][1] });
	console.log(`Changed status to: ${status[ranStat][1]} ${status[ranStat][0]}`);
	setInterval(statusSet, Number(1.8E6));
	
}
