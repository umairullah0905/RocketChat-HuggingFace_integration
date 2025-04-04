import { IHttp, IRead, IModify, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { getHuggingFaceToken } from '../utils/storage';

export class HFPullRequestCommand implements ISlashCommand {
    public command = 'hf-pull-request';
    public i18nDescription = 'Create a new Hugging Face pull request';
    public providesPreview = false;
    public i18nParamsExample = 'repo_id title';

    async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) {
        const args = context.getArguments();
        if (args.length < 2) {
            await this.sendMessage(context, modify, '⚠️ Usage: `/hf-pull-request <repo_id> <title>`');
            return;
        }

        const repoId = args[0];
        const title = args.slice(1).join(' ');

        // Retrieve stored token
        const token = await getHuggingFaceToken(read, persis);
        if (!token) {
            await this.sendMessage(context, modify, '⚠️ Please log in first using `/hf-login <your-token>`');
            return;
        }

        // Send request to FastAPI
        try {
            const response = await http.post('http://127.0.0.1:8000/create/pull_request', {
                headers: { 'Content-Type': 'application/json' },
                data: { repo_id: repoId, title: title, token: token },
            });

            if (response.statusCode >= 200 && response.statusCode < 300 && response.data) {
                await this.sendMessage(
                    context,
                    modify,
                    `✅ Pull request created successfully!
                    \n**Repo:** ${repoId}\n**Title:** ${title}`
                );
            } else {
                throw new Error(response.data?.detail || 'Unknown error');
            }
        } catch (error) {
            console.error('API Error:', error);
            await this.sendMessage(context, modify, `⚠️ Error creating pull request: ${error.message || 'Unknown error'}`);
        }
    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, text: string) {
        const messageBuilder = modify.getCreator().startMessage().setText(text).setRoom(context.getRoom());
        await modify.getCreator().finish(messageBuilder);
    }
}
