import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { faker, simpleFaker } from '@faker-js/faker'

const createUser = async (n) => {
    try {
        const users = []
        for (let i = 0; i < n; i++) {
            const user = User.create({
                name: faker.person.fullName(),
                username: faker.internet.userName(),
                bio: faker.lorem.sentence(10),
                password: "123456",
                avatar: {
                    url: faker.image.avatar(),
                    public_id: faker.system.fileName()
                }
            })
            users.push(user)
        }
        await Promise.all(users)
        console.log('Users created successfully', n)
        process.exit(1);
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
}

const createSingleChat = async (n) => {
    try {
        const users = await User.find().select('_id')
        const chatsPromise = []
        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                const chat = Chat.create({
                    name: faker.lorem.words(2),
                    members: [users[i], users[j]]
                })
                chatsPromise.push(chat)
            }
        }
        await Promise.all(chatsPromise)
        console.log('Chats created successfully')
        process.exit()
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

const createGroupChat = async (n) => {
    try {
        const users = await User.find().select('_id')
        const chatsPromise = []
        for (let i = 0; i < n; i++) {
            const numMembers = simpleFaker.number.int({ min: 3, max: users.length })
            const members = []
            for (let j = 0; j < numMembers; j++) {
                const randomIndex = Math.floor(Math.random() * users.length)
                if (!members.includes(users[randomIndex])) {
                    members.push(users[randomIndex])
                }
            }
            const chat = Chat.create({
                groupChat: true,
                name: faker.lorem.words(1),
                members,
                creator: members[0]
            })
            chatsPromise.push(chat)
        }
        await Promise.all(chatsPromise)
        console.log('Group chats created successfully')
        process.exit()
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

const createMessages = async (n) => {
    try {
        const users = await User.find().select('_id')
        const chats = await Chat.find().select('_id')
        const messages = []
        for (let i = 0; i < n; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const randomChat = chats[Math.floor(Math.random() * chats.length)];
            messages.push(Message.create({
                chat: randomChat,
                sender: randomUser,
                text: faker.lorem.sentence(5)
            }));
        }
        await Promise.all(messages);
        console.log('Messages created successfully');
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

const createMessageInChat = async (n, chatId) => {
    try {
        const users = await User.find().select('_id');
        const messages = [];
        for (let i = 0; i < n; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            messages.push(Message.create({
                chat: chatId,
                sender: randomUser,
                content: faker.lorem.sentence(5)
            }));
        }
        await Promise.all(messages);
        console.log('Messages created successfully');
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

export { createUser, createSingleChat, createGroupChat, createMessages, createMessageInChat }