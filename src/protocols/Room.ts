import User from "./User"

export default class Room {
	private users: User[] = [];
	private roomList: Room[];

	constructor(public name: string, roomList: Room[]) {
		this.roomList = roomList;
	}

	addUser(user: User | string) {
		if (user instanceof User) {
			this.users.push(user);
		} else {
			this.users.push(new User(user));
		}
	}

	private getUserIndex(user: string): number {
		for (let i = 0; i < this.users.length; i++) {
			if (this.users[i] == name) {
				return i;
			}
		}
		return -1;
	}

	removeUser(user: string) {
		let i = this.getUserIndex(user);
		if (i > -1) {
			this.users.splice(i, 1);
		}
	}

	removeUserAndSelf(user: string) {
		this.removeUser(user);
		if (this.users.length == 0) {
			// Room doesn't exist anymore, remove it from the list
			let i = this.roomList.indexOf(this);
			if (i > -1) {
				this.roomList.splice(i, 1);
			}
		}
	}

	getUsers(): User[] {
		return this.users;
	}

	getUser(user: string): User | undefined {
		let i = this.getUserIndex(user);
		if (i > -1) {
			return this.users[i];
		}
		return undefined;
	}
}