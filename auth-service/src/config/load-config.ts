import dotenv from "dotenv";

dotenv.config();

export const config = {
    MAX_CACHE_SIZE: parseInt(process.env.MAX_CACHE_SIZE || "2", 10),
    TTL: parseInt(process.env.TTL || "100",10)
};
