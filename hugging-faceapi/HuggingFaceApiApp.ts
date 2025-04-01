import {
    IAppAccessors,
    IConfigurationExtend,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';


import { HFLoginCommand } from './commands/HFLoginCommand';
import { HFCreateDiscussionCommand } from './commands/HFCreateDiscussionCommand';
import { HFLogoutCommand } from './commands/HFLogoutCommad';
import { HFPullRequestCommand } from './commands/HFPullRequestCommand';
import { HFGetModelsCommand } from './commands/HFGetModelsCommand';
import { HFUploadFileCommand } from './commands/HFUploadFileCommand';
import { OauthLoginHfCommand, GetPublicModelCommand , SetHfTokenCommand} from './commands/OauthLoginHfCommand';

// import { HFUploadFileCommand } from './commands/HFUploadFileCommand';

export class HuggingFaceApiApp extends App {
    private readonly appLogger: ILogger;

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
        this.appLogger = this.getLogger();
        this.appLogger.debug('HuggingFaceApiApp initialized');
    }

    public async extendConfiguration(configuration: IConfigurationExtend) {
        configuration.slashCommands.provideSlashCommand(new HFLoginCommand());
        configuration.slashCommands.provideSlashCommand(new HFCreateDiscussionCommand());
        configuration.slashCommands.provideSlashCommand(new HFLogoutCommand());
        configuration.slashCommands.provideSlashCommand(new HFPullRequestCommand());
        configuration.slashCommands.provideSlashCommand(new HFGetModelsCommand());
        configuration.slashCommands.provideSlashCommand(new HFUploadFileCommand());
        configuration.slashCommands.provideSlashCommand(new OauthLoginHfCommand());
        configuration.slashCommands.provideSlashCommand(new GetPublicModelCommand());
        configuration.slashCommands.provideSlashCommand(new SetHfTokenCommand());



    }
}
