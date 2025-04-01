import { IHttp, IRead, IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';



import { storeHuggingFaceToken } from '../utils/storage';



export class HFLoginCommand implements ISlashCommand {
    public command = 'hf-login';
    public i18nDescription = 'Authenticate with Hugging Face';
    public i18nParamsExample = 'Your_HuggingFace_Token';
    public providesPreview = false;

    async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence) {
        const [token] = context.getArguments();
        if (!token) {
            await this.sendMessage(context, modify, 'Usage: `/hf-login <your-huggingface-token>`');
            return;
        }

        try {
            await storeHuggingFaceToken(persistence, token);
            await this.sendMessage(context, modify, '✅ Hugging Face token saved securely and will expire in 1 hour!');
        } catch (error) {
            await this.sendMessage(context, modify, '❌ Error saving token. Please try again.');
        }
    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, text: string) {
        const creator = modify.getCreator();
        const builder = creator.startMessage().setText(text).setRoom(context.getRoom());
        await creator.finish(builder);
    }
}
