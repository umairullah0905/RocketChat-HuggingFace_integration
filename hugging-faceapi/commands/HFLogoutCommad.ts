import { IPersistence, IRead, IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { removeHuggingFaceToken } from '../utils/storage';

export class HFLogoutCommand implements ISlashCommand {
    public command = 'hf-logout';
    public i18nDescription = 'Log out from Hugging Face and remove stored token';
    public providesPreview = false;
    public i18nParamsExample = '';

    async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: any, persis: IPersistence): Promise<void> {
        await removeHuggingFaceToken(persis); // 🔴 Remove token from storage
        await this.sendMessage(context, modify, '✅ You have been logged out from Hugging Face.');
    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, text: string): Promise<void> {
        const messageBuilder = modify.getCreator().startMessage().setText(text).setRoom(context.getRoom());
        await modify.getCreator().finish(messageBuilder);
    }
}
