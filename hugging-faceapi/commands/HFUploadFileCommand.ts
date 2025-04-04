import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { getHuggingFaceToken } from '../utils/storage'; // Import function to retrieve token

export class HFUploadFileCommand implements ISlashCommand {
    command = 'hf-upload-file';
    i18nParamsExample = 'hf-upload-file_example';
    i18nDescription = 'hf-upload-file_desc';
    providesPreview = false;

    private async sendMessage(context: SlashCommandContext, modify: IModify, message: string): Promise<void> {
        const sender = context.getSender();
        const room = context.getRoom();
        const builder = modify.getCreator().startMessage().setSender(sender).setRoom(room).setText(message);
        await modify.getCreator().finish(builder);
    }

    async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const args = context.getArguments();

        if (args.length < 4) {
            await this.sendMessage(
                context,
                modify,
                '⚠️ Usage: `/hf-upload-file <fileUrl> <repoId> <repoType> <pathInRepo>`'
            );
            return;
        }

        const fileUrl = args[0];
        const repoId = args[1];
        const repoType = args[2];
        const pathInRepo = args[3];

        if (!fileUrl.startsWith('http')) {
            await this.sendMessage(context, modify, '❌ Invalid file URL. Please provide a valid URL.');
            return;
        }

        // Retrieve token from local storage
        const token = await getHuggingFaceToken(read, persis);
        if (!token) {
            await this.sendMessage(context, modify, '❌ Error: No Hugging Face token found. Please set it first.');
            return;
        }

        try {
            const response = await http.post('http://127.0.0.1:8000/upload/upload_file_from_url', {
                headers: { 'Content-Type': 'application/json' },
                data: {
                    file_url: fileUrl,
                    repo_id: repoId,
                    repo_type: repoType,
                    path_in_repo: pathInRepo,
                    token: token,
                },
            });

            if (response.statusCode === 200) {
                await this.sendMessage(
                    context,
                    modify,
                    `✅ File uploaded successfully!\n📂 Repo: *${repoId}*\n📁 Path: *${pathInRepo}*`
                );
            } else {
                await this.sendMessage(
                    context,
                    modify,
                    `⚠️ Error: ${response.data?.detail || 'Unknown error occurred'}`
                );
            }
        } catch (error) {
            await this.sendMessage(context, modify, `❌ Upload failed: ${error.message}`);
        }
    }
}
