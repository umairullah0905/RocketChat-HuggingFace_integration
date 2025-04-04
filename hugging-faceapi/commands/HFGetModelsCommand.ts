import { IHttp, IRead, IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { getHuggingFaceToken } from '../utils/storage';

export class HFGetModelsCommand implements ISlashCommand {
    public command = 'hf-get-models';
    public i18nParamsExample: '';
    public i18nDescription = 'Fetch the list of your Hugging Face models';
    public providesPreview = false;

    async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {
        // Retrieve stored token
        const token = await getHuggingFaceToken(read, persis);
        if (!token) {
            await this.sendMessage(context, modify, '⚠️ Please log in first using `/hf-login <your-token>`');
            return;
        }

        try {
            const response = await http.get('http://127.0.0.1:8000/models/get-models', {
                headers: { 'Content-Type': 'application/json' },
                params: { token },
            });

            if (response.statusCode >= 200 && response.statusCode < 300 && response.data) {
                const models = response.data.models;
                if (models.length === 0) {
                    await this.sendMessage(context, modify, 'ℹ️ No models found in your Hugging Face account.');
                    return;
                }

                const modelsList = models.map((model: any) => `🔹 **${model.id}** (Created at: ${model.created_at})`).join('\n');
                await this.sendMessage(context, modify, `✅ Your Hugging Face models:\n${modelsList}`);
            } else {
                throw new Error(response.data?.detail || 'Unknown error while fetching models');
            }
        } catch (error) {
            console.error('API Error:', error);
            await this.sendMessage(context, modify, `⚠️ Error fetching models: ${error.message || 'Unknown error'}`);
        }
    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, text: string) {
        const messageBuilder = modify.getCreator().startMessage().setText(text).setRoom(context.getRoom());
        await modify.getCreator().finish(messageBuilder);
    }
}