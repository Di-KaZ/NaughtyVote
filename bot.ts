import { AwaitReactionsOptions, Client, Message, MessageEmbed, User } from 'discord.js';
import Voter from './Voter';

// Store registered voters
let voters: Voter[] = [];

// timeout beforer messages getting deleted
const message_delete_timeout = 5000;

const vote_timeout = 5400000;

// url of the vote
const website_url = 'https://serveur-prive.net/minecraft/politicraft-elu-meilleure-communaute-2021-442/vote';

let random_messages: string[] = [
	"Va dormir c'est pas bien de voter la nuit !!!",
	'Clan Iwi les beeestouilles',
	"Lexie c'est vraiment la plus mimi 💕",
	'Hélios, là où le soleil ne se couche plus',
	'Voyage au Canada pas cher',
	'Totem mais tes où ? Pas là mais tes où mais tes pas là',
	'RUSKOV RUSKOV VODKA',
	`Par ici bloc de quartz pour 0.1d !!!`,
	`Dineau diktatur`,
];

let random_emote: string[] = [
	'🤓',
	'🥺',
	'🥵',
	'🥶',
	'🤠',
	'🤖',
	'👀',
	'🐼',
	'🙊',
	'🙉',
	'🙈',
	'🐛',
	'🦑',
	'🦧',
	'🐏',
	'🦚',
	'🍑',
	'💥',
	'🍆',
	'💦',
	'🥞',
	'🍔',
	'🍕',
	'🥙',
	'🍾',
];

const client = new Client();
client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
	console.log(`Connecté en tant que ${client.user?.tag}`);
	client.user?.setPresence({ activity: { name: '!naughty | !stop' } });
});

/**
 * check if an use different from the bot reacted
 * @param reaction reaction to check
 * @param user user that reacted
 * @returns
 */
function user_filter({}: any, user: User): boolean {
	return user.id !== client.user?.id;
}

/**
 * Configuration used for waiting reaction on the bot message
 * only one is necessary
 */
const options_filter: AwaitReactionsOptions = {
	max: 1,
};

/**
 * send the first notif of vote
 * @param user
 * @returns
 */
function naughtytify_this_guy(user: User) {
	// if user already registered
	if (voters.filter((voter) => voter.id === user.id).length !== 0) {
		const voteMessage = new MessageEmbed();
		voteMessage.setTitle(`Tu t'es deja enregistré ! ${user.tag}`);
		voteMessage.setDescription(`Tape '!stop' pour arreter d'etre notifié`);
		voteMessage.setColor('RED');
		user.send(voteMessage).then((message) =>
			setTimeout((message: Message) => message.delete(), message_delete_timeout, message),
		);
		return;
	}

	// else add it to the voters lists
	const voteMessage = new MessageEmbed()
		.setTitle(random_messages[Math.floor(Math.random() * random_messages.length)])
		.setURL(website_url)
		.setDescription(`C'est l'heure de voter !`);

	voters.push({
		id: user.id,
		timeout_id: -1,
	});

	// wait for the voters to vote and wait until the next one
	return user.send(voteMessage).then((message: Message) => {
		message.react(random_emote[Math.floor(Math.random() * random_emote.length)]);
		wait_confimation_of_vote(message, user);
	});
}

/**
 * waiting confirnmation of vote from user on the bot message
 * @param message
 */
function wait_confimation_of_vote(message: Message, user: User) {
	let timeout_id: number = -1;
	message
		.awaitReactions(user_filter, options_filter)
		.then(() => {
			message.delete();
			timeout_id = setTimeout(wait_for_the_next_vote, vote_timeout, user);
			// this black magic get the id of the timeout, used to stop it if user want to stop being notified
			// get the voter associed with the discor msg
			const voter = voters.find((voter) => (voter.id = user.id));
			// set his timeout id to the newly timer
			voter!.timeout_id = timeout_id;
			// update the voters list
			voters = [...voters.filter((voter) => voter.id != user.id), <Voter>voter];
		})
		.catch();
}

function wait_for_the_next_vote(user: User) {
	const voteMessage = new MessageEmbed()
		.setTitle(random_messages[Math.floor(Math.random() * random_messages.length)])
		.setURL(website_url)
		.setDescription(`C'est l'heure de voter !`);

	return user.send(voteMessage).then((message: Message) => {
		message.react(random_emote[Math.floor(Math.random() * random_emote.length)]);
		wait_confimation_of_vote(message, user);
	});
}

/**
 * Wait that a user want to be nauthyfied 😏
 */
client.on('message', (message) => {
	if (message.author.bot) return;
	if (message.content === '!naughty') {
		return naughtytify_this_guy(message.author);
	}
	if (message.content === '!stop') {
		return remove_voter(message.author);
	}
	if (
		message.content.startsWith('!emoteadd') &&
		(message.author.id === '375400233728999424' || message.author.id === '336248608091537417')
	) {
		random_emote = [...random_emote, message.content[message.content.length - 1]];
		console.log(random_emote);
	}
	if (
		message.content.startsWith('!phraseadd') &&
		(message.author.id === '375400233728999424' || message.author.id === '336248608091537417')
	) {
		random_messages = [...random_messages, message.content.substr(11)];
		console.log(random_messages);
	}
});

/**
 * stop notif for this user
 * @param user
 * @returns
 */
function remove_voter(user: User) {
	// getting the voter
	let voter = voters.find((voter) => (voter.id = user.id));
	// if no voter found
	if (voter === undefined) {
		const voteMessage = new MessageEmbed();
		voteMessage.setTitle(`Tu n'est pas enregistré ! ${user.tag}`);
		voteMessage.setColor('RED');
		voteMessage.setDescription("Tape **!naugthy** pour t'enregistrer 😎");
		return user
			.send(voteMessage)
			.then((message) => setTimeout((message: Message) => message.delete(), message_delete_timeout, message));
	}
	// clearing all the notification
	clearTimeout(voter?.timeout_id);
	// remove it from the list of voters
	voters = voters.filter((voter) => voter.id != user.id);
}
