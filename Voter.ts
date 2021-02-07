import { AwaitReactionsOptions, Message, MessageEmbed, User } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { BOT_ID, print_info } from './bot';
import {
	DATA_FOLDER,
	ERR_DATE_PASSED,
	ERR_DATE_PASSED_DESC,
	MESSAGE_DELETE_TIMEOUT,
	VOTE_TIMEOUT,
	WEBSITE_URL,
} from './CONSTATNS';

export default class Voter {
	private user: User;
	private create_date: Date;
	private timeout_id: any;
	private number_of_vote: number;
	private date_to_send_notif: Date | null;

	/**
	 * Configuration used for waiting reaction on the bot message
	 * only one is necessary
	 */
	static options_filter: AwaitReactionsOptions = {
		max: 1,
	};

	constructor(user: User, number_of_vote: number, create_date: Date, date_tosend_notif: Date | null) {
		this.user = user;
		this.timeout_id = -1;
		this.number_of_vote = number_of_vote;
		this.create_date = create_date;
		this.date_to_send_notif = date_tosend_notif;
	}

	/**
	 * check if an use different from the bot reacted
	 * @param reaction reaction to check
	 * @param user user that reacted
	 * @returns
	 */
	public static user_filter({}: any, user: User): boolean {
		return user.id !== BOT_ID;
	}

	/**
	 * send notification after the call of command !naughty of by setTimeout
	 * @param msg
	 * @param emote
	 */
	public sendNotification(msg: string, emote: string) {
		const voteMessage = new MessageEmbed()
			.setTitle(msg)
			.setURL(WEBSITE_URL)
			.setDescription(`C'est l'heure de voter !`);
		this.user.send(voteMessage).then((message: Message) => {
			message.react(emote);
			this.callBackConfimationOfVote(message);
		});
	}

	/**
	 * waiting confirnmation of vote from user on the bot message
	 * if timer is not null using this on instead of constant 1h30
	 * @param message
	 */
	public callBackConfimationOfVote(message: Message) {
		message
			.awaitReactions(Voter.user_filter, Voter.options_filter)
			.then(() => {
				message.delete();
				// add one vote to the total of votes
				this.number_of_vote += 1;
				// change the date wheb to send notif for storage
				this.date_to_send_notif = new Date(new Date().getTime() + VOTE_TIMEOUT); // hmmm 🤔
				// this black magic get the id of the timeout, used to stop it if user want to stop being notified
				this.timeout_id = setTimeout(
					this.sendNotification.bind(this, 'test', '😀'),
					this.date_to_send_notif.getTime() - new Date().getTime(),
				);

				this.saveToFile();
			})
			.catch((reason) => print_info(`Something went wrong : '${reason}'.`));
	}

	public sendEphemeral(msg: string, color: string, description: string | null, timeout: number | null) {
		Voter.sendEphemeralNoVoter(this.user, msg, color, description, timeout);
	}

	public static sendEphemeralNoVoter(
		user: User,
		msg: string,
		color: string,
		description: string | null,
		timeout: number | null,
	) {
		const message = new MessageEmbed();
		message.setTitle(msg);
		message.setColor(color);
		if (description !== null) {
			message.setDescription(description);
		}
		return user.send(message).then((message) => {
			setTimeout(
				(message: Message) => message.delete(),
				timeout !== null ? timeout : MESSAGE_DELETE_TIMEOUT,
				message,
			);
		});
	}

	private saveToFile(): void {
		fs.writeFile(
			path.resolve(DATA_FOLDER, this.user.tag.replace('#', '.').replace(' ', '_') + '.json'),
			JSON.stringify({
				id: this.user.id,
				create_date: this.create_date.getTime(),
				number_of_vote: this.number_of_vote,
				date_to_send_notif: this.date_to_send_notif!.getTime(),
			}),
			(err) => {
				if (err) {
					print_info(`${err}`);
				}
			},
		);
	}

	/**
	 * restore timeout via the data file of this voter
	 */
	public restoreTimeout(): void {
		if (this.date_to_send_notif!.getTime() - new Date().getTime() < 0) {
			this.sendEphemeral(ERR_DATE_PASSED, 'RED', ERR_DATE_PASSED_DESC, 60000);
			return;
		}
		this.timeout_id = setTimeout(
			this.sendNotification.bind(this, 'test', '😀'),
			this.date_to_send_notif!.getTime() - new Date().getTime(),
		);
	}
	public getCreateDate(): Date {
		return this.create_date;
	}

	public setCreateDate(date: Date): void {
		this.create_date = date;
	}

	public getNumberOfVote(): number {
		return this.number_of_vote;
	}

	public getId(): string {
		return this.user.id;
	}

	public getTimeout(): any {
		return this.timeout_id;
	}

	public setNumberOfVote(nb: number) {
		this.number_of_vote = nb;
	}
}
