import bcrypt from "bcryptjs"

export const generateHash = async({ plaintext="" , saltRount=process.env.SALT } = {}) => {
    return bcrypt.hashSync(plaintext , parseInt(saltRount))
}

export const compareHash = async({ plaintext="" , hashValue="" } = {}) => {
    return bcrypt.compareSync(plaintext , hashValue )
}