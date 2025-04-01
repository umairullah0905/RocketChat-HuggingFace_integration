import { IHttp, IRead, IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

// import { OAuthStore } from '../utils/OauthStore';
// import { OAuthStore } from '../utils/OAuthStore';


import { getHuggingFaceToken } from '../utils/storage';

export class HFCreateDiscussionCommand implements ISlashCommand {
    public command = 'hf-create-discussion';
    public i18nDescription = 'Create a new Hugging Face discussion';
    public providesPreview = false;
    public i18nParamsExample = 'repo_id title';

    async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp) {
        const args = context.getArguments();
        if (args.length < 2) {
            await this.sendMessage(context, modify, '⚠️ Usage: `/hf-create-discussion <repo_id> <title>`');
            return;
        }

        const repoId = args[0];
        const title = args.slice(1).join(' ');

        //  Retrieve stored access token
        let token = await getHuggingFaceToken(read);
        if (!token) {
            await this.sendMessage(context, modify, '⚠️ You are not authenticated. Please log in first.');
            return;
        }

        //  Send request to create discussion (Token in body for POST request)
        try {
            const response = await http.post('http://127.0.0.1:8000/create/create-discussion', {
                headers: { 'Content-Type': 'application/json' },
                data: { repo_id: repoId, title: title, token: token },  //  Token in request body
            });

            if (response.statusCode >= 200 && response.statusCode < 300 && response.data) {
                const discussionNum = response.data.discussion_num;
                await this.sendMessage(
                    context,
                    modify,
                    ` Discussion created successfully!\n\n**Repo:** ${repoId}\n**Title:** ${title}\n**Discussion ID:** ${discussionNum}`
                );
            } else {
                throw new Error(response.data?.detail || 'Unknown error');
            }
        } catch (error) {
            await this.sendMessage(context, modify, `⚠️ Error creating discussion: ${error.message || 'Unknown error'}`);
        }
    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, text: string) {
        const messageBuilder = modify.getCreator().startMessage().setText(text).setRoom(context.getRoom());
        await modify.getCreator().finish(messageBuilder);
    }
}

