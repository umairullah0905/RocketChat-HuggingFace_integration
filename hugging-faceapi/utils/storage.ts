import { IRead, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { decryptToken, encryptToken } from './encryption';



const TOKEN_KEY = 'hf-token';
const TOKEN_EXPIRY_DURATION = 20 * 60 * 1000; 

export async function storeHuggingFaceToken(persis: IPersistence, token: string) {
    const encryptedToken = await encryptToken(token);
    const expiresAt = Date.now() + TOKEN_EXPIRY_DURATION; // Set expiry time

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TOKEN_KEY);
    await persis.updateByAssociation(association, { token: encryptedToken, expiresAt }, true);
}

export async function getHuggingFaceToken(read: IRead, persis: IPersistence): Promise<string | null> {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TOKEN_KEY);
    const storedData = await read.getPersistenceReader().readByAssociation(association);

    if (storedData.length > 0) {
        const data = storedData[0] as { token?: string; expiresAt?: number };

        if (data.expiresAt && Date.now() > data.expiresAt) {
            await persis.removeByAssociation(association);//token removed
            return null; 
        }

        return data.token ? await decryptToken(data.token) : null;
    }
    return null;
}

export async function removeHuggingFaceToken(persis: IPersistence): Promise<void> {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TOKEN_KEY);
    await persis.removeByAssociation(association);
}




