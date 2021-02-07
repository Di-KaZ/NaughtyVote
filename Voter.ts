import { AwaitReactionsOptions, Message, MessageEmbed, User } from 'discord.js';
import { BOT_ID, print_info } from './bot';
import { MESSAGE_DELETE_TIMEOUT, VOTE_TIMEOUT, WEBSITE_URL } from './CONSTATNS';

export default class Voter {
	private user: User;
	private create_date: Date;
	private timeout_id: any;
	private number_of_vote: number;

	/**
	 * Configuration used for waiting reaction on the bot message
	 * only one is necessary
	 */
	static options_filter: AwaitReactionsOptions = {
		max: 1,
	};

	// TODO add file reading to save datas
	constructor(user: User, number_of_vote: number) {
		this.user = user;
		this.timeout_id = -1;
		this.number_of_vote = number_of_vote;
		this.create_date = new Date();
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
			this.callBackConfimationOfVote(message, null);
		});
	}

	/**
	 * waiting confirnmation of vote from user on the bot message
	 * if timer is not null using this on instead of constant 1h30
	 * @param message
	 */
	public callBackConfimationOfVote(message: Message, timeout: number | null) {
		message
			.awaitReactions(Voter.user_filter, Voter.options_filter)
			.then(() => {
				message.delete();
				// add one vote to the total of votes
				this.number_of_vote += 1;
				// this black magic get the id of the timeout, used to stop it if user want to stop being notified
				this.timeout_id = setTimeout(
					this.sendNotification.bind(this, 'test', '😀'),
					timeout !== null ? timeout : VOTE_TIMEOUT,
				);
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

	public getCreateDate(): Date {
		return this.create_date;
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
}
