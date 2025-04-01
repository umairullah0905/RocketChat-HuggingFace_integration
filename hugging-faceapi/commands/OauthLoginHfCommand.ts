import { IHttp, IRead, IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { encryptToken,decryptToken } from '../utils/encryption';
import { RocketChatAssociationRecord, RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import { IPersistence } from '@rocket.chat/apps-engine/definition/accessors';


const HF_AUTH_URL = 'http://127.0.0.1:8000/auth/huggingface';
const HF_MODELS_URL = 'http://localhost:8000/models/get-public-models';

export class OauthLoginHfCommand implements ISlashCommand {
    public command = 'loginhf';
    i18nParamsExample: string;
    public i18nDescription = 'Authenticate with Hugging Face';
    public providesPreview = false;

    async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence) {
        const sender = context.getSender();
        const room = context.getRoom();

        const message = modify.getCreator().startMessage()
            .setText(`Click [here](${HF_AUTH_URL}) to log in to Hugging Face. **After authentication, copy your token and use:** \n\n\`/sethf <your-access-token>\``)
            .setRoom(room)
            .setSender(sender);

        await modify.getCreator().finish(message);
    }
}
export class SetHfTokenCommand implements ISlashCommand {
    public command = 'sethf';
    public i18nParamsExample: '';
    public i18nDescription = 'Set your Hugging Face access token';
    public providesPreview = false;

    async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence) {
        const sender = context.getSender();
        const room = context.getRoom();
        const [accessToken] = context.getArguments();

        if (!accessToken) {
            const message = modify.getCreator().startMessage()
                .setText('Error: Please provide your Hugging Face access token. Example: `/sethf your_token_here`')
                .setRoom(room)
                .setSender(sender);
            await modify.getCreator().finish(message);
            return;
        }

        const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, sender.id);
        await persistence.createWithAssociation({ token: accessToken }, association);

        const message = modify.getCreator().startMessage()
            .setText('✅ Your Hugging Face token has been saved! Now, use `/getmodels` to fetch your public models.')
            .setRoom(room)
            .setSender(sender);

        await modify.getCreator().finish(message);
    }
}
export class GetPublicModelCommand implements ISlashCommand {
    public command = 'getmodels';
    public i18nParamsExample: '';
    public i18nDescription = 'Get public models from Hugging Face';
    public providesPreview = false;

    async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence) {
        const sender = context.getSender();
        const room = context.getRoom();
        
        const persistenceReader = read.getPersistenceReader();
        const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, sender.id);
        const storedData = await persistenceReader.readByAssociation(association);

        

        let accessToken: string | null = null;
        if (storedData.length > 0 && typeof storedData[0] === 'object') {
            const storedObject = storedData[0] as { token?: string };
            accessToken = storedObject.token ?? null;
        }

       

        if (!accessToken) {
            await this.sendMessage(modify, room, sender, '⚠️ **Error:** You need to log in first using `/loginhf` and set your token using `/sethf your_token_here`.');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'X-Username': sender.username,
        };

       

        try {
            const response = await http.get(HF_MODELS_URL, { headers });

          

            if (!response || response.statusCode !== 200) {
                await this.sendMessage(modify, room, sender, '❌ **Error:** Failed to fetch models. Ensure you are logged in and your token is correct.');
                return;
            }

            const models = response.data.models.map(model => `- ${model.modelId}`).join('\n');
            await this.sendMessage(modify, room, sender, `📌 **Here are your top 5 public models:**\n${models}`);
        } catch (error) {
            await this.sendMessage(modify, room, sender, `🚨 **Unexpected Error:** \`${JSON.stringify(error)}\``);
        }
    }

    private async sendMessage(modify: IModify, room, sender, text: string) {
        const message = modify.getCreator().startMessage()
            .setText(text)
            .setRoom(room)
            .setSender(sender);
        await modify.getCreator().finish(message);
    }
}







