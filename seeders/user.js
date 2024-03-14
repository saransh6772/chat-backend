import { User } from "../models/user.js";
import { faker } from '@faker-js/faker'

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

export { createUser }