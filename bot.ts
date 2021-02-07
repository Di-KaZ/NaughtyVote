import { Client, User } from 'discord.js';
import { Command } from './Command';
import {
	ERR_DESC,
	ERR_REGISTER,
	ERR_STATS,
	ERR_STOP,
	HELP,
	HELP_DESC,
	STOP_SUCCESS,
	STOP_SUCESS_DESC,
	VOTE_DESC,
} from './CONSTATNS';
import Voter from './Voter';

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

export function print_info(msg: string) {
	console.info(`[INFO][${new Date().toLocaleString()}] : ${msg}`);
}

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

// Bot id used to differenciate users from the bot itself in filter
export let BOT_ID: string | undefined = undefined;

export class NaughtyBot {
	private client: Client;

	private commands: Command[];

	private voters: Voter[];

	constructor() {
		this.client = new Client();
		this.client.login(process.env.BOT_TOKEN);
		this.voters = [];
		this.commands = [];
	}

	/**
	 * Run the bot
	 */
	public run() {
		// register commands
		this.commands = [
			{ commandtxt: '!nhelp', execute: this.help.bind(this) },
			{ commandtxt: '!naughty', execute: this.naughty.bind(this) },
			{ commandtxt: '!nstats', execute: this.stats.bind(this) },
			{ commandtxt: '!nstop', execute: this.stop.bind(this) },
		];

		// set client presence
		this.client.on('ready', () => {
			console.log(`Connecté en tant que ${this.client.user?.tag}`);
			BOT_ID = this.client.user?.id;
			this.client.user?.setPresence({ activity: { name: '!nhelp' } });
		});

		this.client.on('message', (message) => {
			// bot message dont do anything
			if (message.author.bot) return;

			// execute the command if one match
			this.commands.forEach((command) => {
				if (message.content === command.commandtxt) {
					print_info(`user : '${message.author.tag}' is calling : '${command.commandtxt}'`);
					command.execute(message.author);
				}
			});
		});
	}

	/**
	 * return a voter correspondinf to the user if not existing null
	 * @param user
	 * @returns
	 */
	public getVoter(user: User): Voter | null {
		let temp = this.voters.filter((voter) => voter.getId() === user.id)[0];

		if (temp === undefined) {
			return null;
		}
		return temp;
	}

	/**
	 * print help message
	 * @param user
	 */
	public help(user: User): void {
		Voter.sendEphemeralNoVoter(user, HELP, 'GREEN', HELP_DESC, 10000);
	}

	/**
	 * register user and send first notif
	 * @param user
	 */
	public naughty(user: User): void {
		if (this.getVoter(user) !== null) {
			Voter.sendEphemeralNoVoter(user, ERR_REGISTER, 'RED', ERR_DESC, null);
			return;
		}
		// create new user
		let new_voter = new Voter(user, 0);

		// sending the first notif
		new_voter.sendNotification('test', '😉');

		// add it to the registered voters
		this.voters = [...this.voters, new_voter];
	}

	/**
	 * stop send notif for user
	 * @param user
	 */
	public stop(user: User): void {
		let voter = this.getVoter(user);

		if (voter === null) {
			Voter.sendEphemeralNoVoter(user, ERR_STOP, 'RED', ERR_DESC, null);
			return;
		}

		voter.sendEphemeral(STOP_SUCCESS, 'GREEN', STOP_SUCESS_DESC, null);
		// removing from voters
		clearTimeout(voter.getTimeout());
		this.voters = [...this.voters.filter((voter) => voter.getId() !== user.id)];
	}

	public stats(user: User): void {
		let voter = this.getVoter(user);

		if (voter === null) {
			Voter.sendEphemeralNoVoter(user, ERR_STATS, 'RED', ERR_DESC, null);
			return;
		}

		voter.sendEphemeral(
			`Voici tes Stats :\n` +
				`Tu as rejoint le ${voter.getCreateDate().toLocaleString()}\n` +
				`Tu as voté ${voter.getNumberOfVote()} fois depuis !`,
			'BLUE',
			VOTE_DESC,
			15000,
		);
	}
}

// entry point

const naughty = new NaughtyBot();

naughty.run();
