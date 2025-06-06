import { container } from "tsyringe";
import { HashManager } from "../utils/hash.manager";
import { TokenManager } from "../utils/token.manager";
import { EncryptionManager } from "../utils/encryption.manager";

export const registerUtilsDependencies = () => {
    container.register<HashManager>("HashManager", { useClass: HashManager });
    container.register<TokenManager>("TokenManager", { useClass: TokenManager });
    container.register<EncryptionManager>("EncryptionManager", { useClass: EncryptionManager });
};
