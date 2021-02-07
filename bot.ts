import { Client, User } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from './Command';
import {
	DATA_FOLDER,
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
import { Random } from './Random';
import { UserDTO } from './userDTO';
import Voter from './Voter';

export function print_info(msg: string) {
	console.info(`[INFO][${new Date().toLocaleString()}] : ${msg}`);
}

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
	 * load stored data of voters
	 */
	public loadData() {
		print_info(`Chargement des donées utilisateur...`);
		let voterDatas = fs.readdirSync(DATA_FOLDER);
		voterDatas.forEach((voterData) => {
			let userDTO: UserDTO = JSON.parse(
				fs.readFileSync(path.resolve(DATA_FOLDER, voterData), { encoding: 'utf8' }),
			);
			this.client.users.fetch(userDTO.id).then((user) => {
				let new_voter = new Voter(
					user,
					userDTO.number_of_vote,
					new Date(userDTO.create_date),
					new Date(userDTO.date_to_send_notif),
				);
				new_voter.restoreTimeout();
				this.voters = [...this.voters, new_voter];
			});
		});
		print_info(`Chargement Terminé !`);
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
			this.loadData();
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

	public getExistingData(user: User): UserDTO | null {
		let resData: UserDTO | null = null;
		try {
			if (fs.existsSync(path.resolve(DATA_FOLDER, user.tag.replace('#', '.').replace(' ', '_') + '.json'))) {
				resData = JSON.parse(
					fs.readFileSync(path.resolve(DATA_FOLDER, user.tag.replace('#', '.').replace(' ', '_') + '.json'), {
						encoding: 'utf8',
					}),
				);
			}
		} catch (err) {
			print_info(err);
		}
		return resData;
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
		let exist = this.getExistingData(user);
		let new_voter = new Voter(user, 0, new Date(), null);
		if (exist !== null) {
			new_voter.setCreateDate(new Date(exist.create_date));
			new_voter.setNumberOfVote(exist.number_of_vote);
		}
		// sending the first notif
		new_voter.sendNotification(
			RANDOM.texts[Math.floor(Math.random() * RANDOM.texts.length)],
			RANDOM.emotes[Math.floor(Math.random() * RANDOM.emotes.length)],
		);

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

// if (process.env.DEBUG) {
// 	VOTE_TIMEOUT = 15000;
// }

const naughty = new NaughtyBot();
print_info(`Chargement du fichier random...`);
export const RANDOM: Random = JSON.parse(fs.readFileSync(path.resolve('./random.json'), { encoding: 'utf8' }));

naughty.run();
