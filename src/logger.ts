import {DEFAULT_NAMESPACE, MIN_NAMESPACE_BUFFER, DEFAULT_BUFFER} from './constants';
import {
    ExtraData,
    MessageLogItem,
    MessageLogError,
    MessageLogInfo,
    MessageLog,
    LoggerContext,
    LoggerSettings,
    DefaultSettings,
} from './types';
import {parseError as defaultParseError, printLogItem} from './helpers';

const messageLog: MessageLog = {};
const loggersByNamespace: Record<string, Logger> = {};

let defaultSettings: DefaultSettings = {
    bufferSize: DEFAULT_BUFFER,
    parseError: defaultParseError,
    printLog: true,
    logErrorCallback: null,
};

function collectLog(context: LoggerContext, logItem?: MessageLogInfo | MessageLogError) {
    const {namespace, bufferSize, parseError} = context;
    const namespaceMessageLog = messageLog[namespace] || [];
    if (logItem) {
        let preparedLogItem: MessageLogItem;
        if (logItem.level === 'error' && logItem.error) {
            preparedLogItem = {
                ...logItem,
                error: parseError(logItem.error),
            };
            namespaceMessageLog.push(preparedLogItem);
        } else {
            preparedLogItem = logItem as MessageLogItem;
            namespaceMessageLog.push(preparedLogItem);
        }
        if (defaultSettings.printLog) {
            printLogItem(context, preparedLogItem);
        }
    }
    if (namespaceMessageLog.length) {
        messageLog[namespace] = namespaceMessageLog.slice(-bufferSize);
    }
}

class Logger {
    private namespace!: string;
    private bufferSize!: number;
    private parseError!: DefaultSettings['parseError'];
    private selfSettings!: Set<keyof LoggerSettings>;
    private logErrorCallback!: DefaultSettings['logErrorCallback'];

    constructor(namespace: string) {
        if (namespace in loggersByNamespace) {
            return loggersByNamespace[namespace];
        }
        this.namespace = namespace;
        this.bufferSize = defaultSettings.bufferSize;
        this.parseError = defaultParseError;
        this.logErrorCallback = defaultSettings.logErrorCallback;
        loggersByNamespace[namespace] = this;
        this.selfSettings = new Set();
    }

    log(message: string, data?: ExtraData) {
        collectLog(this.getContext(), {level: 'info', msg: message, data, time: Date.now()});
    }

    logError(message: string, error?: Error, data?: ExtraData) {
        collectLog(this.getContext(), {
            level: 'error',
            msg: message,
            error,
            data,
            time: Date.now(),
        });

        if (typeof this.logErrorCallback === 'function') {
            this.logErrorCallback(message, error, data);
        }
    }

    setSettings(settings: Partial<LoggerSettings>) {
        const updatedSettingsKeys = this.updateSettings(settings);
        updatedSettingsKeys.forEach((key) => this.selfSettings.add(key));
    }

    setDefaults(settings: Partial<DefaultSettings>) {
        const {bufferSize, parseError, printLog, logErrorCallback} = settings;
        let newBuffer = defaultSettings.bufferSize;
        if (typeof bufferSize === 'number' && bufferSize >= MIN_NAMESPACE_BUFFER) {
            newBuffer = bufferSize;
            this.setLoggersSettings('bufferSize', newBuffer);
        }
        let newParseError = defaultSettings.parseError;
        if (typeof parseError === 'function') {
            newParseError = parseError;
            this.setLoggersSettings('parseError', newParseError);
        }
        let newPrintLog = defaultSettings.printLog;
        if (typeof printLog === 'boolean') {
            newPrintLog = printLog;
        }

        let newLogErrorCallback = defaultSettings.logErrorCallback;
        if (typeof logErrorCallback === 'function') {
            newLogErrorCallback = logErrorCallback;
            this.setLoggersSettings('logErrorCallback', newLogErrorCallback);
        }
        defaultSettings = {
            ...defaultSettings,
            bufferSize: newBuffer,
            parseError: newParseError,
            printLog: newPrintLog,
            logErrorCallback: newLogErrorCallback,
        };
    }

    get(namespace: string): Logger {
        if (namespace in loggersByNamespace) {
            return loggersByNamespace[namespace];
        }
        return new Logger(namespace);
    }

    getLogs(): MessageLog {
        return messageLog;
    }

    private updateSettings(settings: Partial<LoggerSettings>) {
        const updatedSettingsKeys: Array<keyof LoggerSettings> = [];
        const {bufferSize, parseError, logErrorCallback} = settings;
        if (typeof bufferSize === 'number' && bufferSize >= MIN_NAMESPACE_BUFFER) {
            this.bufferSize = bufferSize;
            updatedSettingsKeys.push('bufferSize');
            collectLog(this.getContext());
        }
        if (typeof parseError === 'function') {
            this.parseError = parseError;
            updatedSettingsKeys.push('parseError');
        }
        if (typeof logErrorCallback === 'function') {
            this.logErrorCallback = logErrorCallback;
            updatedSettingsKeys.push('logErrorCallback');
        }
        return updatedSettingsKeys;
    }

    private getContext(): LoggerContext {
        return {
            namespace: this.namespace,
            bufferSize: this.bufferSize,
            parseError: this.parseError,
            logErrorCallback: this.logErrorCallback,
        };
    }

    private setLoggersSettings(
        field: keyof LoggerSettings,
        value: LoggerSettings[keyof LoggerSettings],
    ) {
        Object.values(loggersByNamespace).forEach((logger) => {
            if (!logger.selfSettings.has(field)) {
                logger.updateSettings({[field]: value});
            }
        });
    }
}

const defaultLogger = new Logger(DEFAULT_NAMESPACE);

export default defaultLogger;
