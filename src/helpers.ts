import {REQUEST_ID_HEADER, TRACE_ID_HEADER} from './constants';
import {LoggerContext, MessageLogItem} from './types';

function pickHeaders(headers: Record<string, string>): Record<string, string> {
    const pickedHeaders: Record<string, string> = {};
    [REQUEST_ID_HEADER, TRACE_ID_HEADER].forEach((key) => {
        if (headers[key]) {
            pickedHeaders[key] = headers[key];
        }
    });
    return pickedHeaders;
}

export function parseError(error: Error): Record<string, unknown> {
    if (!(error instanceof Error)) {
        return error;
    }
    const anyError = error as any;
    const parsedError: Record<string, unknown> = {};
    ['status', 'code', 'message', 'stack', 'details', 'debug', 'traceId', 'requestId'].forEach(
        (field) => {
            if (field in anyError) {
                parsedError[field] = anyError[field];
            }
        },
    );

    if (anyError.response) {
        parsedError.response = {
            status: anyError.response?.status,
            data: anyError.response?.data,
            headers: anyError.response?.headers && pickHeaders(anyError.response.headers || {}),
        };
    }

    return parsedError;
}

const repeat = (str: string, times: number) => new Array(times + 1).join(str);

const pad = (num: number, maxLength: number) =>
    repeat('0', maxLength - num.toString().length) + num;

const formatTime = (time: number) => {
    const date = new Date(time);
    return `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:${pad(
        date.getSeconds(),
        2,
    )}.${pad(date.getMilliseconds(), 3)}`;
};

export function printLogItem(context: LoggerContext, logItem: MessageLogItem) {
    const {level, msg, time, ...restLog} = logItem;
    const isErrorLevel = level === 'error';
    const {namespace} = context;
    const greyCSS = 'color: #808080; font-weight: lighter;';
    try {
        console.groupCollapsed(
            `%c[${namespace}] %c${msg} %c@ ${formatTime(time)}`,
            greyCSS,
            `color: ${isErrorLevel ? '#ff4f45' : '#000000'};`,
            greyCSS,
        );
        if (restLog) {
            Object.entries(restLog).forEach(([key, value]) => {
                if (value) {
                    console.log(`%c${key} `, greyCSS, value);
                }
            });
        } else {
            console.log('%cNo extra data', greyCSS);
        }
        console.groupEnd();
    } catch (error) {
        console[isErrorLevel ? 'error' : 'log'](logItem);
    }
}
