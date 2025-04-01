import { IHttp, IRead, IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

// export class HFLoginCommand implements ISlashCommand {
//     public command = 'hf-login';
//     public i18nDescription = 'Authenticate with Hugging Face';
//     public i18nParamsExample = 'Your_HuggingFace_Token'; // ✅ Required by ISlashCommand
//     public providesPreview = false;

//     async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence) {
//         const [token] = context.getArguments();
//         if (!token) {
//             await this.sendMessage(context, modify, 'Usage: `/hf-login <your-huggingface-token>`');
//             return;
//         }

//         // Store token in Rocket.Chat's local storage
//         const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'hf-token');
//         await persistence.updateByAssociation(association, { token }, true);

//         await this.sendMessage(context, modify, '✅ Hugging Face token saved successfully!');
//     }

//     private async sendMessage(context: SlashCommandContext, modify: IModify, text: string) {
//         const creator = modify.getCreator();
//         const builder = creator.startMessage().setText(text).setRoom(context.getRoom());
//         await creator.finish(builder);
//     }
 
// }

import { storeHuggingFaceToken } from '../utils/storage';
import { encryptToken, decryptToken} from '../utils/encryption';

// export class HFLoginCommand implements ISlashCommand {
//     public command = 'hf-login';
//     public i18nDescription = 'Authenticate with Hugging Face';
//     public i18nParamsExample = 'Your_HuggingFace_Token';
//     public providesPreview = false;

//     async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence) {
//         const [token] = context.getArguments();
//         if (!token) {
//             await this.sendMessage(context, modify, 'Usage: `/hf-login <your-huggingface-token>`');
//             return;
//         }

//         try {
//             const encryptedToken = await encryptToken(token);

//             const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'hf-token');
//             await persistence.updateByAssociation(association, { token: encryptedToken }, true);

//             await this.sendMessage(context, modify, '✅ Hugging Face token saved securely!');
//         } catch (error) {
//             await this.sendMessage(context, modify, '❌ Error saving token. Please try again.');
//         }
//     }

//     private async sendMessage(context: SlashCommandContext, modify: IModify, text: string) {
//         const creator = modify.getCreator();
//         const builder = creator.startMessage().setText(text).setRoom(context.getRoom());
//         await creator.finish(builder);
//     }
// }



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
