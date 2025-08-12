import CryptoJS from "crypto-js";

export const generateEncryption = async({plaintext = "" , secretKey = process.env.ENCRYPTION_SECRET}) =>{
    return CryptoJS.AES.encrypt(plaintext, secretKey).toString();
}

export const decryptEncryption = async({ciphertext = "" , secretKey = process.env.ENCRYPTION_SECRET}) =>{
    return CryptoJS.AES.decrypt(ciphertext, secretKey).toString(CryptoJS.enc.Utf8);
}