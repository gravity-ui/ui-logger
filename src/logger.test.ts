import logger from './logger';
import {DEFAULT_NAMESPACE} from './constants';
import {ParsedMessageLogError} from './types';

describe('Logger', () => {
    const NEW_NAMESPACE = 'new';
    const SOME_NAMESPACE = 'some';
    const ERROR_MESSAGE = 'Failed';
    let callbackFired = false;
    logger.setDefaults({
        printLog: false,
        logErrorCallback: function () {
            callbackFired = true;
        },
    });

    it('logger.log записывает в default namespace общего лога', () => {
        logger.log('log', {value: 'value'});
        const logs = logger.getLogs();
        const {time, ...restLog} = logs[DEFAULT_NAMESPACE][0];
        expect(restLog).toEqual({
            level: 'info',
            msg: 'log',
            data: {value: 'value'},
        });
        expect(typeof time).toBe('number');
    });

    it('logger.logError записывает в default namespace общего лога', () => {
        const mockedError = new Error(ERROR_MESSAGE);
        logger.logError('log', mockedError, {value: 'value'});
        const logs = logger.getLogs();
        const errorLog = logs[DEFAULT_NAMESPACE][1] as ParsedMessageLogError;
        expect(errorLog.error!.message).toBe(ERROR_MESSAGE);
    });

    it('Информация об ошибке сохраняется после сериализации', () => {
        const logs = JSON.parse(JSON.stringify(logger.getLogs()));
        const errorLog = logs[DEFAULT_NAMESPACE][1] as ParsedMessageLogError;
        expect(errorLog.error!.message).toBe(ERROR_MESSAGE);
        expect(typeof errorLog.error!.stack).toBe('string');
    });

    it('Логгер с новым namespace создается и лог пишется', () => {
        const newLogger = logger.get(NEW_NAMESPACE);
        const newMessage = 'log';
        newLogger.log(newMessage);
        expect(NEW_NAMESPACE in logger.getLogs()).toBe(true);
        expect(newLogger.getLogs()[NEW_NAMESPACE][0].msg).toBe(newMessage);
    });

    it('При получении ранее созданного логгера, лог не обнуляется для данного namespace', () => {
        const newLogger = logger.get(NEW_NAMESPACE);
        newLogger.logError(ERROR_MESSAGE);
        expect(logger.getLogs()[NEW_NAMESPACE].length).toBe(2);
    });

    it('Корректно меняется parseError', () => {
        const newLogger = logger.get(NEW_NAMESPACE);
        const someLogger = newLogger.get(SOME_NAMESPACE);
        function newParseError() {
            return {parsed: true};
        }
        someLogger.setSettings({parseError: newParseError});
        someLogger.logError('error message', new Error('failed'));
        const errorLog = someLogger.getLogs()[SOME_NAMESPACE][0] as ParsedMessageLogError;
        expect(errorLog.error).toEqual({parsed: true});
    });

    it('Вызывается logErrorCallback при вызове logError', () => {
        const newLogger = logger.get(NEW_NAMESPACE);
        newLogger.logError('error message', new Error('failed'));
        expect(callbackFired).toEqual(true);

        callbackFired = false;
        const someLogger = newLogger.get(SOME_NAMESPACE);
        someLogger.logError('error message', new Error('failed'));
        expect(callbackFired).toEqual(true);
    });
});
