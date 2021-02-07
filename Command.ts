import { User } from 'discord.js';

export interface Command {
	commandtxt: string;
	execute: (user: User) => void;
}
