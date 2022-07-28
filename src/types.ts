export type ExtraData = Record<string, unknown>;

export type MessageLogInfo = {
    level: 'info';
    msg: string;
    time: number;
    data?: ExtraData;
};

export type MessageLogError = {
    level: 'error';
    msg: string;
    time: number;
    error?: Error;
    data?: ExtraData;
};

export type ParsedMessageLogError = Omit<MessageLogError, 'error'> & {
    error?: Record<string, unknown>;
};

export type MessageLogItem = MessageLogInfo | ParsedMessageLogError;

export type MessageLog = Record<string, MessageLogItem[]>;

export type DefaultSettings = {
    bufferSize: number;
    parseError: (error: Error) => Record<string, unknown>;
    printLog: boolean;
    logErrorCallback: ((message: string, error?: Error, data?: ExtraData) => void) | null;
};

export type LoggerSettings = Omit<DefaultSettings, 'printLog'>;

export type LoggerContext = LoggerSettings & {
    namespace: string;
};
